'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { supabase } from '@/lib/supabaseClient'
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
  const t = useTranslations('Login')
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
      setError(t('errors.unauthorized'))
    }
    if (redirectedFrom) {
      sessionStorage.setItem('redirect_to', redirectedFrom)
    }
  }, [redirectedFrom, errorParam, t])

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
        if (error.message.includes('Invalid login credentials')) {
          setError(t('errors.invalidCredentials'))
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
      setError(t('errors.generic'))
      setLoading(false)
      setRedirecting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-200">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* En-tête avec couleur du navbar */}
          <div className="px-8 py-6 bg-sand-400">
            <div className="flex items-center justify-center mb-2">
              <User className="w-12 h-12 text-ink-800" />
            </div>
            <h2 className="text-center text-2xl font-bold text-ink-800">
              {t('title')}
            </h2>
            <p className="mt-2 text-center text-sm text-ink-800">
              {t('welcome')}
            </p>
          </div>

          {/* Formulaire */}
          <form className="px-8 py-6 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-clay-50 border-l-4 border-brick-600 p-4 rounded">
                <p className="text-sm text-brick-600">{error}</p>
              </div>
            )}

            {redirecting && (
              <div className="bg-sand-50 border-l-4 border-olive-600 p-4 rounded">
                <p className="text-sm text-olive-600">{t('successMessage')}</p>
              </div>
            )}

            <div className="space-y-5">
              {/* Email */}
              <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-ink-800 mb-1">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent text-ink-900"
                    placeholder={t('emailPlaceholder')}
                    disabled={redirecting}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-ink-800 mb-1">
                  {t('passwordLabel')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent text-ink-900"
                    placeholder={t('passwordPlaceholder')}
                    disabled={redirecting}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || redirecting}
                className="w-full flex items-center justify-center py-3 px-4 text-sm font-medium rounded-lg text-white bg-clay-700 hover:bg-clay-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  t('submitLoading')
                ) : redirecting ? (
                  t('submitRedirecting')
                ) : (
                  <>
                    {t('submitButton')}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Lien mot de passe oublié */}
            <div className="text-center">
              <Link href="#" className="text-sm text-ink-700 hover:text-ink-800 transition-colors">
                {t('forgotPassword')}
              </Link>
            </div>
          </form>

          {/* Séparateur */}
          <div className="px-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-sand-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-ink-500">{t('newCustomer')}</span>
              </div>
            </div>
          </div>

          {/* Lien inscription */}
          <div className="px-8 py-6">
            <Link
              href="/signup"
              className="w-full flex items-center justify-center py-3 px-4 border-2 border-clay-700 text-clay-700 font-medium rounded-lg hover:bg-clay-700 hover:text-white transition-colors duration-200"
            >
              {t('createAccount')}
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