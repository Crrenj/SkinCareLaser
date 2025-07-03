'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Mail, Lock, ArrowRight } from 'lucide-react'

export default function SimpleLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    console.log('🔑 Tentative de connexion avec:', email)

    try {
      // Connexion simple avec Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Erreur de connexion:', error)
        setError('Email ou mot de passe incorrect')
        setLoading(false)
        return
      }

      if (data.session) {
        console.log('✅ Connexion réussie pour:', data.session.user.email)
        
        // Vérifier si l'utilisateur est admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.session.user.id)
          .single()

        if (profileError) {
          console.error('❌ Erreur profil:', profileError)
          // Rediriger vers l'accueil par défaut
          router.push('/')
          return
        }

        // Redirection basée sur le statut admin
        if (profile?.is_admin) {
          console.log('🎯 Redirection admin vers /admin/overview')
          router.push('/admin/overview')
        } else {
          console.log('🎯 Redirection utilisateur vers /')
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
              Connexion Simplifiée
            </h2>
            <p className="mt-2 text-center text-sm text-gray-700">
              Version de test - FARMAU
            </p>
          </div>

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

          {/* Liens de test */}
          <div className="px-8 py-4 bg-gray-50 text-center text-sm">
            <p className="text-gray-600">
              Version simplifiée pour diagnostic
            </p>
            <a 
              href="/login" 
              className="text-[#CCC5BD] hover:text-[#B8B1A8] underline"
            >
              Retour à la version normale
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 