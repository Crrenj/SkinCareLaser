'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

/**
 * Page de callback post-Supabase Auth (vérification d'email, OAuth).
 * Attend que la session soit posée puis redirige selon le rôle :
 *   - admin → /admin/product
 *   - autre → sessionStorage.redirect_to ou /
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Vérification de la session...')

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        // Laisser un instant aux cookies pour se poser
        await new Promise(resolve => setTimeout(resolve, 1000))

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Callback session error:', error)
          setStatus('Erreur de session, redirection...')
          setTimeout(() => router.push('/login?error=session_error'), 1000)
          return
        }

        if (!session) {
          setStatus('Session non trouvée, redirection...')
          setTimeout(() => router.push('/login'), 1000)
          return
        }

        setStatus('Session trouvée, vérification des permissions...')

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single()

        if (profileError) console.error('Callback profile error:', profileError)

        let redirectPath = '/'
        if (profile?.is_admin) {
          redirectPath = '/admin/product'
          setStatus('Accès admin confirmé, redirection...')
        } else {
          const savedRedirect = sessionStorage.getItem('redirect_to')
          if (savedRedirect) {
            redirectPath = savedRedirect
            sessionStorage.removeItem('redirect_to')
          }
          setStatus("Redirection vers l'accueil...")
        }

        await new Promise(resolve => setTimeout(resolve, 500))
        router.push(redirectPath)
      } catch (error) {
        console.error('Callback unexpected error:', error)
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
