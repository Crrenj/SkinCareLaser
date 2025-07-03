'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DebugPage() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    checkSession()
  }, [])

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const checkSession = async () => {
    try {
      addTestResult('🔍 Vérification de la session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        addTestResult(`❌ Erreur session: ${error.message}`)
        setError(error.message)
        return
      }

      if (session) {
        addTestResult(`✅ Session trouvée: ${session.user.email}`)
        setSession(session)
        
        // Récupérer le profil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          addTestResult(`❌ Erreur profil: ${profileError.message}`)
        } else {
          addTestResult(`✅ Profil trouvé: ${profile.first_name} ${profile.last_name}`)
          addTestResult(`👑 Admin: ${profile.is_admin}`)
          setProfile(profile)
        }
      } else {
        addTestResult('❌ Aucune session trouvée')
      }
    } catch (err) {
      addTestResult(`❌ Erreur: ${err}`)
      setError(String(err))
    }
  }

  const testLogin = async () => {
    const email = 'j@gmail.com'
    const password = prompt('Entrez le mot de passe pour j@gmail.com:')
    
    if (!password) return
    
    try {
      addTestResult(`🔑 Test de connexion avec ${email}...`)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        addTestResult(`❌ Erreur connexion: ${error.message}`)
        setError(error.message)
        return
      }

      addTestResult(`✅ Connexion réussie!`)
      await checkSession()
      
    } catch (err) {
      addTestResult(`❌ Erreur: ${err}`)
      setError(String(err))
    }
  }

  const logout = async () => {
    try {
      addTestResult('🚪 Déconnexion...')
      await supabase.auth.signOut()
      setSession(null)
      setProfile(null)
      addTestResult('✅ Déconnexion réussie')
    } catch (err) {
      addTestResult(`❌ Erreur déconnexion: ${err}`)
    }
  }

  const goToAdmin = () => {
    addTestResult('🎯 Redirection vers /admin/overview...')
    window.location.href = '/admin/overview'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Page de Debug - Authentification</h1>
        
        {/* Informations de session */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Actuelle</h2>
          {session ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>ID:</strong> {session.user.id}</p>
              <p><strong>Role (app_metadata):</strong> {session.user.app_metadata?.role || 'N/A'}</p>
              <button 
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Se déconnecter
              </button>
            </div>
          ) : (
            <p className="text-gray-500">Aucune session active</p>
          )}
        </div>

        {/* Informations de profil */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profil Utilisateur</h2>
          {profile ? (
            <div className="space-y-2">
              <p><strong>Nom:</strong> {profile.first_name} {profile.last_name}</p>
              <p><strong>Admin:</strong> {profile.is_admin ? '✅ Oui' : '❌ Non'}</p>
              <p><strong>Rôle:</strong> {profile.role || 'N/A'}</p>
              <p><strong>Créé le:</strong> {new Date(profile.created_at).toLocaleString()}</p>
              {profile.is_admin && (
                <button 
                  onClick={goToAdmin}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Aller au Dashboard Admin
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Aucun profil chargé</p>
          )}
        </div>

        {/* Actions de test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions de Test</h2>
          <div className="space-x-4">
            <button 
              onClick={checkSession}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Vérifier Session
            </button>
            <button 
              onClick={testLogin}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Tester Connexion Admin
            </button>
          </div>
        </div>

        {/* Logs de test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Logs de Test</h2>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">Aucun test effectué</p>
            ) : (
              <pre className="text-sm">
                {testResults.join('\n')}
              </pre>
            )}
          </div>
          <button 
            onClick={() => setTestResults([])}
            className="mt-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Effacer Logs
          </button>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded p-4">
            <h3 className="text-red-800 font-semibold">Dernière Erreur:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
} 