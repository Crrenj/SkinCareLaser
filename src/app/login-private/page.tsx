'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Mail, Lock, ArrowRight, AlertTriangle } from 'lucide-react'

/**
 * ⚠️ ATTENTION - PAGE DE LOGIN NAVIGATION PRIVÉE ⚠️
 * 
 * Version spécialisée pour la navigation privée/incognito.
 * 
 * 🚨 NE PAS MODIFIER SANS AUTORISATION 🚨
 * 
 * Cette page résout les problèmes de :
 * - Cookies bloqués en navigation privée
 * - Sessions temporaires
 * - localStorage limité
 * - Détection automatique du mode privé
 * 
 * Fonctionnalités spéciales :
 * - Détection de navigation privée
 * - Alertes visuelles pour l'utilisateur
 * - Gestion des limitations
 * - Conseils contextuels
 */

export default function PrivateLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    // Détecter la navigation privée
    const detectPrivateMode = () => {
      try {
        // Test localStorage
        localStorage.setItem('test', 'test')
        localStorage.removeItem('test')
        
        // Test cookies
        document.cookie = 'test=1; SameSite=Lax'
        const cookieEnabled = document.cookie.includes('test=1')
        
        if (!cookieEnabled) {
          setIsPrivate(true)
        }
      } catch (error) {
        setIsPrivate(true)
      }
    }
    
    detectPrivateMode()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    console.log('🔑 Connexion en mode privé avec:', email)
    console.log('🔒 Navigation privée détectée:', isPrivate)

    try {
      // Connexion avec gestion spéciale pour navigation privée
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Erreur de connexion:', error)
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect')
        } else {
          setError(`Erreur: ${error.message}`)
        }
        setLoading(false)
        return
      }

      if (data.session) {
        console.log('✅ Session créée:', data.session.user.email)
        
        // Vérifier le profil admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.session.user.id)
          .single()

        if (profileError) {
          console.error('❌ Erreur profil:', profileError)
          setError('Erreur lors de la vérification du profil')
          setLoading(false)
          return
        }

        // Redirection
        if (profile?.is_admin) {
          console.log('🎯 Redirection admin')
          router.push('/admin/overview')
        } else {
          console.log('🎯 Redirection utilisateur')
          router.push('/')
        }
      }
    } catch (err) {
      console.error('❌ Erreur inattendue:', err)
      setError('Une erreur est survenue lors de la connexion')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EDEAE5' }}>
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* En-tête */}
          <div className="px-8 py-6" style={{ backgroundColor: '#CCC5BD' }}>
            <h2 className="text-center text-2xl font-bold text-gray-800">
              Connexion Navigation Privée
            </h2>
            <p className="mt-2 text-center text-sm text-gray-700">
              Version optimisée - FARMAU
            </p>
          </div>

          {/* Alerte navigation privée */}
          {isPrivate && (
            <div className="px-8 py-4 bg-orange-50 border-l-4 border-orange-400">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Navigation privée détectée
                  </p>
                  <p className="text-xs text-orange-700">
                    La session sera temporaire
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form className="px-8 py-6 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              {/* Email */}
              <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCC5BD] focus:border-transparent text-gray-900"
                    placeholder="j@gmail.com"
                    disabled={loading}
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
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCC5BD] focus:border-transparent text-gray-900"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#CCC5BD' }}
              >
                {loading ? (
                  'Connexion...'
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Conseils pour navigation privée */}
          <div className="px-8 py-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-800 mb-2">
              💡 Conseils pour la navigation privée :
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Utilisez un navigateur normal pour une meilleure expérience</li>
              <li>• La session sera temporaire en mode privé</li>
              <li>• Évitez de fermer l'onglet pendant l'utilisation</li>
            </ul>
            
            <div className="mt-4 space-y-2">
              <a 
                href="/login-simple" 
                className="block text-center text-[#CCC5BD] hover:text-[#B8B1A8] underline text-sm"
              >
                Version simple
              </a>
              <a 
                href="/debug" 
                className="block text-center text-[#CCC5BD] hover:text-[#B8B1A8] underline text-sm"
              >
                Page de debug
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
