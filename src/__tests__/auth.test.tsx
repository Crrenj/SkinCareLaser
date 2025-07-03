import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// D'abord définir les mocks en dehors de vi.mock
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()
const mockGet = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockFrom = vi.fn()

// Ensuite utiliser vi.mock avec les fonctions définies
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
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
    },
    from: (...args: any[]) => mockFrom(...args),
  },
}))

// Maintenant importer les composants après les mocks
import LoginPage from '@/app/(auth)/login/page'
import SignupPage from '@/app/(auth)/signup/page'

describe('Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset sessionStorage mock
    vi.mocked(window.sessionStorage.setItem).mockClear()
    vi.mocked(window.sessionStorage.getItem).mockClear()
    vi.mocked(window.sessionStorage.removeItem).mockClear()
  })

  describe('Login Page', () => {
    it('affiche les erreurs Supabase lors de la connexion', async () => {
      // Configurer le mock pour retourner une erreur
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })

      render(<LoginPage />)

      // Remplir le formulaire
      const emailInput = screen.getByPlaceholderText('Adresse email')
      const passwordInput = screen.getByPlaceholderText('Mot de passe')
      const submitButton = screen.getByText('Se connecter')

      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'wrongpassword')
      await userEvent.click(submitButton)

      // Vérifier que l'erreur est affichée
      await waitFor(() => {
        expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
      })
    })

    it('redirige vers /admin/overview pour un utilisateur admin (app_metadata)', async () => {
      // Mock d'un utilisateur admin via app_metadata
      const mockSession = {
        user: {
          id: '123',
          email: 'admin@example.com',
          app_metadata: { role: 'admin' }
        },
        access_token: 'token'
      }

      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockSession.user, session: mockSession },
        error: null
      })

      render(<LoginPage />)

      // Remplir et soumettre le formulaire
      await userEvent.type(screen.getByPlaceholderText('Adresse email'), 'admin@example.com')
      await userEvent.type(screen.getByPlaceholderText('Mot de passe'), 'password')
      await userEvent.click(screen.getByText('Se connecter'))

      // Vérifier la redirection vers le dashboard admin
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/admin/overview')
      })
    })

    it('redirige vers /admin/overview pour un utilisateur admin (table profiles)', async () => {
      // Mock d'un utilisateur admin via la table profiles
      const mockSession = {
        user: {
          id: '123',
          email: 'admin@example.com',
          app_metadata: {}
        },
        access_token: 'token'
      }

      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockSession.user, session: mockSession },
        error: null
      })

      // Mock de la requête à la table profiles
      const mockSelect = vi.fn()
      const mockEq = vi.fn()
      const mockSingle = vi.fn()

      mockFrom.mockReturnValueOnce({
        select: mockSelect
      })
      mockSelect.mockReturnValueOnce({
        eq: mockEq
      })
      mockEq.mockReturnValueOnce({
        single: mockSingle
      })
      mockSingle.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      })

      render(<LoginPage />)

      // Remplir et soumettre le formulaire
      await userEvent.type(screen.getByPlaceholderText('Adresse email'), 'admin@example.com')
      await userEvent.type(screen.getByPlaceholderText('Mot de passe'), 'password')
      await userEvent.click(screen.getByText('Se connecter'))

      // Vérifier la redirection vers le dashboard admin
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/admin/overview')
      })
    })

    it('redirige vers la route d\'origine pour un utilisateur non-admin', async () => {
      // Mock sessionStorage
      vi.mocked(window.sessionStorage.getItem).mockReturnValue('/catalogue')

      // Mock d'un utilisateur non-admin
      const mockSession = {
        user: {
          id: '456',
          email: 'user@example.com',
          app_metadata: {}
        },
        access_token: 'token'
      }

      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockSession.user, session: mockSession },
        error: null
      })

      // Mock de la requête à la table profiles
      const mockSelect = vi.fn()
      const mockEq = vi.fn()
      const mockSingle = vi.fn()

      mockFrom.mockReturnValueOnce({
        select: mockSelect
      })
      mockSelect.mockReturnValueOnce({
        eq: mockEq
      })
      mockEq.mockReturnValueOnce({
        single: mockSingle
      })
      mockSingle.mockResolvedValueOnce({
        data: { is_admin: false },
        error: null
      })

      render(<LoginPage />)

      // Remplir et soumettre le formulaire
      await userEvent.type(screen.getByPlaceholderText('Adresse email'), 'user@example.com')
      await userEvent.type(screen.getByPlaceholderText('Mot de passe'), 'password')
      await userEvent.click(screen.getByText('Se connecter'))

      // Vérifier la redirection vers la route stockée
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/catalogue')
        expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('redirect_to')
      })
    })

    it('stocke l\'URL de redirection depuis les query params', () => {
      // Mock des search params
      mockGet.mockImplementation((key) => {
        if (key === 'redirectedFrom') return '/admin/products'
        return null
      })

      render(<LoginPage />)

      // Vérifier que l'URL est stockée dans sessionStorage
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('redirect_to', '/admin/products')
    })
  })

  describe('Signup Page', () => {
    it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
      render(<SignupPage />)

      // Remplir le formulaire avec des mots de passe différents
      await userEvent.type(screen.getByPlaceholderText('Adresse email'), 'test@example.com')
      await userEvent.type(screen.getByPlaceholderText('Mot de passe (min. 6 caractères)'), 'password123')
      await userEvent.type(screen.getByPlaceholderText('Confirmer le mot de passe'), 'password456')
      await userEvent.click(screen.getByText('S\'inscrire'))

      // Vérifier que l'erreur est affichée
      expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument()
    })

    it('affiche une erreur si le mot de passe est trop court', async () => {
      render(<SignupPage />)

      // Remplir le formulaire avec un mot de passe court
      await userEvent.type(screen.getByPlaceholderText('Adresse email'), 'test@example.com')
      await userEvent.type(screen.getByPlaceholderText('Mot de passe (min. 6 caractères)'), '12345')
      await userEvent.type(screen.getByPlaceholderText('Confirmer le mot de passe'), '12345')
      await userEvent.click(screen.getByText('S\'inscrire'))

      // Vérifier que l'erreur est affichée
      expect(screen.getByText('Le mot de passe doit contenir au moins 6 caractères')).toBeInTheDocument()
    })

    it('crée un compte et un profil avec succès', async () => {
      // Mock de la création de compte réussie
      const mockUser = {
        id: '789',
        email: 'newuser@example.com'
      }

      mockSignUp.mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null
      })

      // Mock de l'insertion du profil
      const mockInsert = vi.fn().mockResolvedValueOnce({
        data: null,
        error: null
      })

      mockFrom.mockReturnValueOnce({
        insert: mockInsert
      })

      render(<SignupPage />)

      // Remplir et soumettre le formulaire
      await userEvent.type(screen.getByPlaceholderText('Adresse email'), 'newuser@example.com')
      await userEvent.type(screen.getByPlaceholderText('Mot de passe (min. 6 caractères)'), 'password123')
      await userEvent.type(screen.getByPlaceholderText('Confirmer le mot de passe'), 'password123')
      await userEvent.click(screen.getByText('S\'inscrire'))

      // Vérifier que le compte est créé
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123',
          options: {
            emailRedirectTo: expect.stringContaining('/auth/callback')
          }
        })
      })

      // Vérifier que le profil est créé
      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(mockInsert).toHaveBeenCalledWith({
        id: '789',
        is_admin: false
      })

      // Vérifier le message de succès
      expect(screen.getByText('Inscription réussie ! Redirection vers la page de connexion...')).toBeInTheDocument()
    })
  })
}) 