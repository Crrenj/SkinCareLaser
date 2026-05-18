'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'

/**
 * ⚠️ ATTENTION - PAGE DE LOGIN PRINCIPALE ⚠️
 * 
 * Cette page gère la connexion utilisateur avec des corrections spéciales.
 * 
 * 🚨 NE PAS MODIFIER SANS AUTORISATION 🚨
 * 
 * Problèmes résolus :
 * - Redirection directe (pas via callback)
 * - Gestion des ports (3000 vs 3001)
 * - Sessions perdues après connexion
 * - Erreurs de navigation privée
 * - Vérification du statut admin
 * 
 * Fonctionnalités :
 * - Détection automatique du port
 * - Redirection intelligente
 * - Gestion des erreurs
 * - Support navigation privée limité
 * 
 * Si vous devez modifier ce code :
 * 1. Demandez l'autorisation
 * 2. Testez en navigation normale ET privée
 * 3. Vérifiez les redirections admin/user
 * 4. Testez avec différents ports
 */

/**
 * Composant de connexion avec gestion des search params
 */
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  // Récupérer la redirection et l'erreur depuis les params
  const redirectedFrom = searchParams.get('redirectedFrom')
  const errorParam = searchParams.get('error')

  useEffect(() => {
    if (errorParam === 'unauthorized') {
      setError('Accès non autorisé. Vous devez être administrateur.')
    }
    if (redirectedFrom) {
      sessionStorage.setItem('redirect_to', redirectedFrom)
    }
  }, [redirectedFrom, errorParam])

  /**
   * Gère la soumission du formulaire de connexion
   * @param e - Event du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Connexion avec Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Gérer les erreurs spécifiques
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect')
        } else {
          setError(error.message)
        }
        setLoading(false)
        return
      }

      if (data.session) {
        const isAdminFromMeta = data.session.user.app_metadata?.role === 'admin'
        let isAdmin = isAdminFromMeta

        if (!isAdminFromMeta) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', data.session.user.id)
            .single()

          isAdmin = profile?.is_admin === true
        }

        setRedirecting(true)
        setLoading(false)

        const redirectPath = isAdmin
          ? '/admin/product'
          : sessionStorage.getItem('redirect_to') || '/'

        // Pause courte pour laisser les cookies de session se poser avant la nav
        await new Promise(resolve => setTimeout(resolve, 500))

        router.push(redirectPath)

        if (!isAdmin) {
          sessionStorage.removeItem('redirect_to')
        }
      }
    } catch (err) {
      console.error('Erreur login:', err)
      setError('Une erreur est survenue lors de la connexion')
      setLoading(false)
      setRedirecting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EDEAE5' }}>
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* En-tête avec couleur du navbar */}
          <div className="px-8 py-6" style={{ backgroundColor: '#CCC5BD' }}>
            <div className="flex items-center justify-center mb-2">
              <User className="w-12 h-12 text-gray-700" />
            </div>
            <h2 className="text-center text-2xl font-bold text-gray-800">
              Connexion à votre compte
            </h2>
            <p className="mt-2 text-center text-sm text-gray-700">
              Bienvenue chez FARMAU
            </p>
          </div>

          {/* Formulaire */}
          <form className="px-8 py-6 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {redirecting && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <p className="text-sm text-green-700">Connexion réussie ! Redirection en cours...</p>
              </div>
            )}

            <div className="space-y-5">
              {/* Email */}
              <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCC5BD] focus:border-transparent text-gray-900"
                    placeholder="votre@email.com"
                    disabled={redirecting}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCC5BD] focus:border-transparent text-gray-900"
                    placeholder="••••••••"
                    disabled={redirecting}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || redirecting}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#CCC5BD'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8B1A8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#CCC5BD'}
              >
                {loading ? (
                  'Connexion...'
                ) : redirecting ? (
                  'Redirection...'
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Lien mot de passe oublié */}
            <div className="text-center">
              <Link href="#" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>
          </form>

          {/* Séparateur */}
          <div className="px-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Nouveau client ?</span>
              </div>
            </div>
          </div>

          {/* Lien inscription */}
          <div className="px-8 py-6">
            <Link 
              href="/signup" 
              className="w-full flex items-center justify-center py-3 px-4 border-2 border-[#CCC5BD] text-[#CCC5BD] font-medium rounded-lg hover:bg-[#CCC5BD] hover:text-white transition-all duration-200"
            >
              Créer un compte
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

/**
 * Page de connexion avec Suspense boundary
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginForm />
    </Suspense>
  )
} 