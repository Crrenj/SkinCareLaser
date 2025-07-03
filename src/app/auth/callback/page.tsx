'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

/**
 * ⚠️ ATTENTION - PAGE DE CALLBACK D'AUTHENTIFICATION ⚠️
 * 
 * Cette page gère les redirections après connexion.
 * 
 * 🚨 NE PAS MODIFIER SANS AUTORISATION 🚨
 * 
 * Problèmes résolus :
 * - Synchronisation des sessions
 * - Délais appropriés pour les cookies
 * - Gestion des erreurs de redirection
 * - Feedback utilisateur pendant l'attente
 * 
 * Fonctionnalités :
 * - Vérification de session avec délai
 * - Redirection admin/user appropriée
 * - Gestion des erreurs gracieuse
 * - Interface de chargement
 * 
 * Si vous devez modifier ce code :
 * 1. Demandez l'autorisation
 * 2. Testez les délais de redirection
 * 3. Vérifiez la synchronisation des sessions
 * 4. Testez les cas d'erreur
 */

/**
 * Page de callback après authentification
 * Vérifie la session et redirige vers la bonne page
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Vérification de la session...')

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      console.log('🔄 Vérification de la session dans callback...')
      setStatus('Vérification de la session...')
      
      try {
        // Attendre que les cookies se stabilisent
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Forcer le rafraîchissement de la session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Erreur session:', error)
          setStatus('Erreur de session, redirection...')
          setTimeout(() => router.push('/login?error=session_error'), 1000)
          return
        }
        
        if (!session) {
          console.log('❌ Pas de session dans callback')
          setStatus('Session non trouvée, redirection...')
          setTimeout(() => router.push('/login'), 1000)
          return
        }

        console.log('✅ Session trouvée dans callback:', session.user.email)
        setStatus('Session trouvée, vérification des permissions...')
        
        // Vérifier si admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          console.error('❌ Erreur profil:', profileError)
          // Continuer même si erreur profil, rediriger vers accueil
        }
        
        // Déterminer où rediriger
        let redirectPath = '/'
        
        if (profile?.is_admin) {
          redirectPath = '/admin/overview'
          setStatus('Accès admin confirmé, redirection...')
        } else {
          const savedRedirect = sessionStorage.getItem('redirect_to')
          if (savedRedirect) {
            redirectPath = savedRedirect
            sessionStorage.removeItem('redirect_to')
          }
          setStatus('Redirection vers l\'accueil...')
        }
        
        console.log('🎯 Redirection finale vers:', redirectPath)
        
        // Attendre un peu avant la redirection pour éviter les conflits
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Utiliser router.push au lieu de window.location.href
        router.push(redirectPath)
        
      } catch (error) {
        console.error('❌ Erreur dans callback:', error)
        setStatus('Erreur inattendue, redirection...')
        setTimeout(() => router.push('/login?error=callback_error'), 1000)
      }
    }

    checkSessionAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EDEAE5' }}>
      <div className="text-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CCC5BD] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">{status}</p>
          <p className="mt-2 text-sm text-gray-500">Veuillez patienter...</p>
        </div>
      </div>
    </div>
  )
} 