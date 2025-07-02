'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

/**
 * Page de connexion DEBUG
 * Capture et affiche toutes les erreurs pour diagnostic
 */
export default function LoginDebugPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])

  // Capturer TOUTES les erreurs console
  useEffect(() => {
    const originalError = console.error
    const originalWarn = console.warn
    const originalLog = console.log

    console.error = (...args) => {
      const message = `[ERROR] ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ')}`
      setDebugLog(prev => [...prev, message])
      originalError(...args)
    }

    console.warn = (...args) => {
      const message = `[WARN] ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ')}`
      setDebugLog(prev => [...prev, message])
      originalWarn(...args)
    }

    console.log = (...args) => {
      const message = `[LOG] ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ')}`
      setDebugLog(prev => [...prev, message])
      originalLog(...args)
    }

    // Capturer les erreurs non gérées
    window.addEventListener('error', (event) => {
      setDebugLog(prev => [...prev, `[UNCAUGHT ERROR] ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`])
    })

    window.addEventListener('unhandledrejection', (event) => {
      setDebugLog(prev => [...prev, `[UNHANDLED PROMISE] ${event.reason}`])
    })

    return () => {
      console.error = originalError
      console.warn = originalWarn
      console.log = originalLog
    }
  }, [])

  const addDebug = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLog(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    addDebug('Début de la connexion...')

    try {
      addDebug(`Tentative de connexion avec: ${email}`)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        addDebug(`Erreur Supabase: ${error.message}`)
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.session) {
        addDebug('Session créée avec succès')
        addDebug(`User ID: ${data.session.user.id}`)
        
        // Vérifier le profil
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', data.session.user.id)
            .single()

          addDebug(`Profil récupéré: ${JSON.stringify(profile)}`)
          if (profileError) {
            addDebug(`Erreur profil: ${JSON.stringify(profileError)}`)
          }

          const isAdmin = profile?.is_admin === true
          addDebug(`Est admin: ${isAdmin}`)

          const redirectPath = isAdmin ? '/admin/dashboard' : '/'
          addDebug(`Tentative de redirection vers: ${redirectPath}`)

          // Essayer différentes méthodes
          addDebug('1. Essai avec router.push()')
          router.push(redirectPath)

          setTimeout(() => {
            addDebug('2. Essai avec window.location.href')
            window.location.href = redirectPath
          }, 1000)

          setTimeout(() => {
            addDebug('3. Essai avec URL complète')
            window.location.href = window.location.origin + redirectPath
          }, 2000)

        } catch (err) {
          addDebug(`Erreur lors de la vérification du profil: ${err}`)
        }
      }
    } catch (err) {
      addDebug(`Erreur globale: ${err}`)
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  const copyDebugLog = () => {
    const logText = debugLog.join('\n')
    navigator.clipboard.writeText(logText)
    alert('Log copié dans le presse-papier !')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-4xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion DEBUG
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Formulaire de connexion */}
          <div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Adresse email"
                  />
                </div>
                <div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Mot de passe"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </div>
            </form>

            <div className="mt-4 space-y-2">
              <a 
                href="/admin/dashboard" 
                className="block text-center text-blue-600 hover:text-blue-500 underline"
              >
                Accès direct admin/dashboard
              </a>
              <a 
                href="/debug" 
                className="block text-center text-blue-600 hover:text-blue-500 underline"
              >
                Page de debug
              </a>
            </div>
          </div>

          {/* Log de debug */}
          <div>
            <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-xs">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-bold">Console de debug</h3>
                <button
                  onClick={copyDebugLog}
                  className="bg-gray-700 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                >
                  Copier le log
                </button>
              </div>
              {debugLog.length === 0 ? (
                <div className="text-gray-500">En attente d'activité...</div>
              ) : (
                debugLog.map((log, i) => (
                  <div key={i} className="mb-1 break-all">
                    {log}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 p-4 rounded-md">
              <h4 className="font-bold text-yellow-800 mb-2">Instructions :</h4>
              <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                <li>Essayez de vous connecter</li>
                <li>Observez les messages dans la console de debug</li>
                <li>Si une erreur apparaît, cliquez sur "Copier le log"</li>
                <li>Partagez le log pour diagnostic</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 