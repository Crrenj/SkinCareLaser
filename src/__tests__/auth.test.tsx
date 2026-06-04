import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import frMessages from '../messages/fr.json'

const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()
const mockGet = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}))

// Mock next-intl : résout les clés via fr.json (table de vérité)
type MessageNode = { [key: string]: MessageNode | string }
const messagesRoot = frMessages as unknown as MessageNode

function resolveKey(node: MessageNode | undefined, path: string[]): string | undefined {
  let current: MessageNode | string | undefined = node
  for (const segment of path) {
    if (current && typeof current === 'object') {
      current = (current as MessageNode)[segment]
    } else {
      return undefined
    }
  }
  return typeof current === 'string' ? current : undefined
}

vi.mock('next-intl', () => {
  function buildT(namespace: string) {
    const ns = messagesRoot[namespace] as MessageNode | undefined
    function t(key: string, values?: Record<string, string>) {
      let value = resolveKey(ns, key.split('.')) ?? key
      if (values) {
        for (const [k, v] of Object.entries(values)) {
          value = value.replace(`{${k}}`, v)
        }
      }
      return value
    }
    t.rich = (key: string) => resolveKey(ns, key.split('.')) ?? key
    return t
  }
  return {
    useTranslations: (namespace: string) => buildT(namespace),
    useLocale: () => 'fr',
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  }
})

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')
  type LinkProps = {
    href: string
    children: React.ReactNode
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>
  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
    }),
    usePathname: () => '/',
    Link: ({ href, children, ...rest }: LinkProps) =>
      React.createElement('a', { href, ...rest }, children),
  }
})

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}))

import LoginPage from '@/app/[locale]/(auth)/login/page'
import SignupPage from '@/app/[locale]/(auth)/signup/page'

const loginMessages = frMessages.Login
const signupMessages = frMessages.Signup

const getEmailInput = () => screen.getByLabelText(loginMessages.emailLabel)
const getPasswordInput = () => screen.getByLabelText(loginMessages.passwordLabel)
const submitLogin = () => screen.getByRole('button', { name: loginMessages.submitButton })
const submitSignup = () => screen.getByRole('button', { name: signupMessages.submitButton })

describe('Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(window.sessionStorage.setItem).mockClear()
    vi.mocked(window.sessionStorage.getItem).mockClear()
    vi.mocked(window.sessionStorage.removeItem).mockClear()
    mockGet.mockReset()
    mockGet.mockReturnValue(null)
  })

  describe('Login Page', () => {
    it('affiche les erreurs Supabase lors de la connexion', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      render(<LoginPage />)

      await userEvent.type(await screen.findByLabelText(loginMessages.emailLabel), 'test@example.com')
      await userEvent.type(getPasswordInput(), 'wrongpassword')
      await userEvent.click(submitLogin())

      await waitFor(() => {
        expect(screen.getByText(loginMessages.errors.invalidCredentials)).toBeInTheDocument()
      })
    })

    it('redirige vers /admin pour un utilisateur admin (app_metadata)', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: '123', email: 'admin@example.com', app_metadata: { role: 'admin' } },
          session: {
            user: { id: '123', email: 'admin@example.com', app_metadata: { role: 'admin' } },
            access_token: 'token',
          },
        },
        error: null,
      })

      render(<LoginPage />)

      await userEvent.type(getEmailInput(), 'admin@example.com')
      await userEvent.type(getPasswordInput(), 'password')
      await userEvent.click(submitLogin())

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin')
      }, { timeout: 2000 })
    })

    it('redirige vers /admin pour un utilisateur admin (table profiles)', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: '123', email: 'admin@example.com', app_metadata: {} },
          session: {
            user: { id: '123', email: 'admin@example.com', app_metadata: {} },
            access_token: 'token',
          },
        },
        error: null,
      })

      mockRpc.mockResolvedValueOnce({ data: true, error: null })

      render(<LoginPage />)

      await userEvent.type(getEmailInput(), 'admin@example.com')
      await userEvent.type(getPasswordInput(), 'password')
      await userEvent.click(submitLogin())

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin')
      }, { timeout: 2000 })
    })

    it("redirige vers la route d'origine pour un utilisateur non-admin", async () => {
      vi.mocked(window.sessionStorage.getItem).mockReturnValue('/catalogue')

      mockSignInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: '456', email: 'user@example.com', app_metadata: {} },
          session: {
            user: { id: '456', email: 'user@example.com', app_metadata: {} },
            access_token: 'token',
          },
        },
        error: null,
      })

      mockRpc.mockResolvedValueOnce({ data: false, error: null })

      render(<LoginPage />)

      await userEvent.type(getEmailInput(), 'user@example.com')
      await userEvent.type(getPasswordInput(), 'password')
      await userEvent.click(submitLogin())

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/catalogue')
        expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('redirect_to')
      }, { timeout: 2000 })
    })

    it("stocke l'URL de redirection depuis les query params", async () => {
      mockGet.mockImplementation((key) =>
        key === 'redirectedFrom' ? '/admin/products' : null,
      )

      render(<LoginPage />)

      await waitFor(() => {
        expect(window.sessionStorage.setItem).toHaveBeenCalledWith('redirect_to', '/admin/products')
      })
    })
  })

  describe('Signup Page', () => {
    const fillSignupForm = async (opts: {
      email?: string
      password: string
      confirm: string
    }) => {
      await userEvent.type(screen.getByLabelText(signupMessages.firstNameLabel), 'Jean')
      await userEvent.type(screen.getByLabelText(signupMessages.lastNameLabel), 'Dupont')
      await userEvent.type(
        screen.getByLabelText(signupMessages.emailLabel),
        opts.email ?? 'test@example.com',
      )
      await userEvent.type(screen.getByLabelText(signupMessages.phoneLabel), '+1 809 123 4567')
      await userEvent.type(
        screen.getByLabelText(new RegExp(`^${signupMessages.passwordLabel}\\b`, 'i')),
        opts.password,
      )
      await userEvent.type(
        screen.getByLabelText(signupMessages.confirmPasswordLabel),
        opts.confirm,
      )
    }

    it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
      render(<SignupPage />)
      await fillSignupForm({ password: 'password123', confirm: 'password456' })
      await userEvent.click(submitSignup())

      expect(screen.getByText(signupMessages.errors.passwordsMismatch)).toBeInTheDocument()
    })

    it('affiche une erreur si le mot de passe est trop court', async () => {
      render(<SignupPage />)
      await fillSignupForm({ password: '1234567', confirm: '1234567' })
      await userEvent.click(submitSignup())

      expect(screen.getByText(signupMessages.errors.passwordTooShort)).toBeInTheDocument()
    })

    it('appelle signUp avec les bonnes options + metadata', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { user: { id: '789', email: 'newuser@example.com' }, session: null },
        error: null,
      })

      const mockUpdateEq = vi.fn().mockResolvedValueOnce({ data: null, error: null })
      mockFrom.mockReturnValueOnce({
        update: () => ({ eq: mockUpdateEq }),
      })

      render(<SignupPage />)
      await fillSignupForm({
        email: 'newuser@example.com',
        password: 'password123',
        confirm: 'password123',
      })
      await userEvent.click(submitSignup())

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
          email: 'newuser@example.com',
          password: 'password123',
          options: expect.objectContaining({
            emailRedirectTo: expect.stringContaining('/auth/callback'),
            data: expect.objectContaining({
              first_name: 'Jean',
              last_name: 'Dupont',
              phone: '+1 809 123 4567',
            }),
          }),
        }))
      })
    })
  })
})
