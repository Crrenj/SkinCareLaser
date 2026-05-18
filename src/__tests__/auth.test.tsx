import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()
const mockGet = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockFrom = vi.fn()

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

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

import LoginPage from '@/app/(auth)/login/page'
import SignupPage from '@/app/(auth)/signup/page'

// Helpers — les inputs n'ont pas de placeholder uniforme, on cible par label
const getEmailInput = () => screen.getByLabelText(/adresse email/i)
const getPasswordInput = () => screen.getByLabelText('Mot de passe')

describe('Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(window.sessionStorage.setItem).mockClear()
    vi.mocked(window.sessionStorage.getItem).mockClear()
    vi.mocked(window.sessionStorage.removeItem).mockClear()
  })

  describe('Login Page', () => {
    it('affiche les erreurs Supabase lors de la connexion', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })

      render(<LoginPage />)

      await userEvent.type(await screen.findByLabelText(/adresse email/i), 'test@example.com')
      await userEvent.type(getPasswordInput(), 'wrongpassword')
      await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

      await waitFor(() => {
        expect(screen.getByText('Email ou mot de passe incorrect')).toBeInTheDocument()
      })
    })

    it('redirige vers /admin/product pour un utilisateur admin (app_metadata)', async () => {
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

      await userEvent.type(await screen.findByLabelText(/adresse email/i), 'admin@example.com')
      await userEvent.type(getPasswordInput(), 'password')
      await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/product')
      }, { timeout: 2000 })
    })

    it('redirige vers /admin/product pour un utilisateur admin (table profiles)', async () => {
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

      // Mock du fetch profiles
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: { is_admin: true }, error: null })
      mockFrom.mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      })

      render(<LoginPage />)

      await userEvent.type(await screen.findByLabelText(/adresse email/i), 'admin@example.com')
      await userEvent.type(getPasswordInput(), 'password')
      await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/product')
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

      const mockSingle = vi.fn().mockResolvedValueOnce({ data: { is_admin: false }, error: null })
      mockFrom.mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      })

      render(<LoginPage />)

      await userEvent.type(await screen.findByLabelText(/adresse email/i), 'user@example.com')
      await userEvent.type(getPasswordInput(), 'password')
      await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/catalogue')
        expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('redirect_to')
      }, { timeout: 2000 })
    })

    it("stocke l'URL de redirection depuis les query params", async () => {
      mockGet.mockImplementation((key) => (key === 'redirectedFrom' ? '/admin/products' : null))

      render(<LoginPage />)

      await waitFor(() => {
        expect(window.sessionStorage.setItem).toHaveBeenCalledWith('redirect_to', '/admin/products')
      })
    })
  })

  describe('Signup Page', () => {
    it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
      render(<SignupPage />)

      await userEvent.type(screen.getByLabelText(/prénom/i), 'Jean')
      await userEvent.type(screen.getByLabelText(/^nom \*/i), 'Dupont')
      await userEvent.type(screen.getByLabelText(/adresse email/i), 'test@example.com')
      await userEvent.type(screen.getByLabelText(/^mot de passe \*/i), 'password123')
      await userEvent.type(screen.getByLabelText(/confirmer le mot de passe/i), 'password456')
      await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))

      expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument()
    })

    it('affiche une erreur si le mot de passe est trop court', async () => {
      render(<SignupPage />)

      await userEvent.type(screen.getByLabelText(/prénom/i), 'Jean')
      await userEvent.type(screen.getByLabelText(/^nom \*/i), 'Dupont')
      await userEvent.type(screen.getByLabelText(/adresse email/i), 'test@example.com')
      await userEvent.type(screen.getByLabelText(/^mot de passe \*/i), '12345')
      await userEvent.type(screen.getByLabelText(/confirmer le mot de passe/i), '12345')
      await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))

      expect(screen.getByText('Le mot de passe doit contenir au moins 6 caractères')).toBeInTheDocument()
    })

    it('appelle signUp avec les bonnes options + metadata', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { user: { id: '789', email: 'newuser@example.com' }, session: null },
        error: null,
      })

      // Mock du profiles.update
      const mockUpdateEq = vi.fn().mockResolvedValueOnce({ data: null, error: null })
      mockFrom.mockReturnValueOnce({
        update: () => ({ eq: mockUpdateEq }),
      })

      render(<SignupPage />)

      await userEvent.type(screen.getByLabelText(/prénom/i), 'Jean')
      await userEvent.type(screen.getByLabelText(/^nom \*/i), 'Dupont')
      await userEvent.type(screen.getByLabelText(/adresse email/i), 'newuser@example.com')
      await userEvent.type(screen.getByLabelText(/^mot de passe \*/i), 'password123')
      await userEvent.type(screen.getByLabelText(/confirmer le mot de passe/i), 'password123')
      await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
          email: 'newuser@example.com',
          password: 'password123',
          options: expect.objectContaining({
            emailRedirectTo: expect.stringContaining('/auth/callback'),
            data: expect.objectContaining({
              first_name: 'Jean',
              last_name: 'Dupont',
            }),
          }),
        }))
      })
    })
  })
})
