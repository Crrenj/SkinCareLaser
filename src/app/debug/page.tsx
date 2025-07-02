'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DebugPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Récupérer la session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        setError({ type: 'session', error: sessionError })
        return
      }

      if (session?.user) {
        setUser(session.user)

        // Récupérer le profil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          setError({ type: 'profile', error: profileError })
        } else {
          setProfile(profileData)
        }
      }
    } catch (err) {
      setError({ type: 'general', error: err })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Chargement...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Page de Debug - Authentification</h1>

        {/* État de connexion */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">État de connexion</h2>
          {user ? (
            <div className="text-green-600">✅ Connecté</div>
          ) : (
            <div className="text-red-600">❌ Non connecté</div>
          )}
        </div>

        {/* Informations utilisateur */}
        {user && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Informations utilisateur</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify({
                id: user.id,
                email: user.email,
                app_metadata: user.app_metadata,
                user_metadata: user.user_metadata
              }, null, 2)}
            </pre>
          </div>
        )}

        {/* Profil */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profil dans la table profiles</h2>
          {profile ? (
            <>
              <div className="mb-2">
                <span className="font-semibold">is_admin:</span>{' '}
                <span className={profile.is_admin ? 'text-green-600 font-bold' : 'text-gray-600'}>
                  {profile.is_admin ? 'TRUE ✅' : 'FALSE ❌'}
                </span>
              </div>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </>
          ) : (
            <div className="text-red-600">❌ Aucun profil trouvé</div>
          )}
        </div>

        {/* Erreurs */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-red-800">Erreurs</h2>
            <pre className="text-red-600 overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-2">
            <a 
              href="/login" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Aller à la page de connexion
            </a>
            {user && (
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.reload()
                }}
                className="block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Se déconnecter
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 