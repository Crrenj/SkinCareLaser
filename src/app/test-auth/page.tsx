'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function TestAuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('j@gmail.com')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string[]>([])
  const [session, setSession] = useState<any>(null)

  // Ajouter un message de statut
  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`])
  }

  // Vérifier la session au chargement
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    addStatus('🔍 Vérification de la session...')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      setSession(session)
      addStatus(`✅ Session active: ${session.user.email}`)
      
      // Vérifier si admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profile) {
        addStatus(`👤 Profil: ${JSON.stringify(profile, null, 2)}`)
      }
    } else {
      addStatus('❌ Pas de session active')
    }
  }

  const handleLogin = async () => {
    addStatus('🔐 Tentative de connexion...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        addStatus(`❌ Erreur: ${error.message}`)
        return
      }

      if (data.session) {
        addStatus(`✅ Connexion réussie: ${data.session.user.email}`)
        setSession(data.session)
        
        // Attendre un peu
        setTimeout(() => {
          addStatus('🎯 Redirection vers admin...')
          router.push('/admin/overview')
        }, 2000)
      }
    } catch (err: any) {
      addStatus(`❌ Erreur complète: ${err.message}`)
    }
  }

  const handleLogout = async () => {
    addStatus('🚪 Déconnexion...')
    await supabase.auth.signOut()
    setSession(null)
    addStatus('✅ Déconnecté')
  }

  const handleDirectAccess = () => {
    window.location.href = '/admin/overview'
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test d'authentification</h1>
        
        {/* Formulaire de connexion */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Connexion</h2>
          
          {!session ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <button
                onClick={handleLogin}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Se connecter
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-green-600">✅ Connecté en tant que : {session.user.email}</p>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Se déconnecter
              </button>
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Actions rapides</h2>
          <div className="space-x-4">
            <button
              onClick={checkSession}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Vérifier session
            </button>
            
            <button
              onClick={handleDirectAccess}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Accès direct admin
            </button>
          </div>
        </div>

        {/* Journal des événements */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Journal des événements</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {status.map((msg, i) => (
              <div key={i} className="mb-1">
                {msg}
              </div>
            ))}
          </div>
        </div>

        {/* Informations de debug */}
        <div className="mt-6 text-sm text-gray-600">
          <p>URL actuelle : {typeof window !== 'undefined' ? window.location.href : ''}</p>
          <p>Port : {typeof window !== 'undefined' ? window.location.port || '3000' : ''}</p>
        </div>
      </div>
    </div>
  )
} 