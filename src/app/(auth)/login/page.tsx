'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

/**
 * Page de connexion
 * Gère la connexion des utilisateurs et les redirige selon leur rôle
 * @returns Page de connexion avec formulaire
 */
export default function LoginPage() {
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
    // Log l'URL actuelle pour debug
    console.log('URL actuelle:', window.location.href)
    console.log('Port utilisé:', window.location.port || '3000')
    
    // Afficher l'erreur d'autorisation si présente
    if (errorParam === 'unauthorized') {
      setError('Accès non autorisé. Vous devez être administrateur.')
    }

    // Stocker l'URL de redirection dans sessionStorage
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
        console.log('Session utilisateur:', data.session.user)
        
        // Vérifier si l'utilisateur est admin
        const isAdminFromMeta = data.session.user.app_metadata?.role === 'admin'
        console.log('Admin depuis app_metadata:', isAdminFromMeta)
        
        // Si pas dans app_metadata, vérifier dans la table profiles
        let isAdmin = isAdminFromMeta
        
        if (!isAdminFromMeta) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', data.session.user.id)
            .single()

          console.log('Profil récupéré:', profile)
          console.log('Erreur profil:', profileError)

          isAdmin = profile?.is_admin === true
        }

        console.log('Est admin final:', isAdmin)

        // Marquer comme redirection en cours
        setRedirecting(true)
        setLoading(false)

        // Déterminer l'URL de redirection
        const redirectPath = isAdmin 
          ? '/admin/dashboard'
          : sessionStorage.getItem('redirect_to') || '/'

        console.log('Redirection vers:', redirectPath)

        // Rediriger vers la page de callback qui gérera la suite
        console.log('Redirection vers la page de callback...')
        window.location.href = '/auth/callback'

        // Nettoyer sessionStorage
        if (!isAdmin) {
          sessionStorage.removeItem('redirect_to')
        }
      }
    } catch (err) {
      console.error('Erreur login complète:', err)
      setError('Une erreur est survenue lors de la connexion')
      setLoading(false)
      setRedirecting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à votre compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              créez un nouveau compte
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {redirecting && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              Connexion réussie ! Redirection en cours...
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Adresse email"
                disabled={redirecting}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
                disabled={redirecting}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || redirecting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : redirecting ? 'Redirection...' : 'Se connecter'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>Problème de redirection ?</p>
          <a 
            href="/admin/dashboard" 
            className="text-blue-600 hover:text-blue-500 underline font-medium"
          >
            Accéder directement au dashboard admin
          </a>
          <p className="mt-2">ou essayez la</p>
          <a 
            href="/login-debug" 
            className="text-blue-600 hover:text-blue-500 underline font-medium"
          >
            Page de connexion DEBUG
          </a>
        </div>
      </div>
    </div>
  )
} 