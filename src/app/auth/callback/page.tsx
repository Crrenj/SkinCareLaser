'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

/**
 * Page de callback après authentification
 * Vérifie la session et redirige vers la bonne page
 */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      console.log('🔄 Vérification de la session dans callback...')
      
      // Attendre un peu pour que les cookies se stabilisent
      await new Promise(resolve => setTimeout(resolve, 500))
      
      try {
        // Vérifier la session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('✅ Session trouvée dans callback:', session.user.email)
          
          // Vérifier si admin
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single()
          
          // Déterminer où rediriger
          let redirectPath = '/'
          
          if (profile?.is_admin) {
            redirectPath = '/admin/dashboard'
          } else {
            const savedRedirect = sessionStorage.getItem('redirect_to')
            if (savedRedirect) {
              redirectPath = savedRedirect
              sessionStorage.removeItem('redirect_to')
            }
          }
          
          console.log('🎯 Redirection finale vers:', redirectPath)
          
          // Utiliser window.location.href pour forcer le rechargement complet
          window.location.href = redirectPath
        } else {
          console.log('❌ Pas de session dans callback')
          router.push('/login')
        }
      } catch (error) {
        console.error('Erreur dans callback:', error)
        router.push('/login?error=callback_error')
      }
    }

    checkSessionAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Connexion en cours...</p>
      </div>
    </div>
  )
} 