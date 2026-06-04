'use client'

import { logger } from '@/lib/logger'
import { ADMIN_HOME_PATH } from '@/lib/constants'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { routing } from '@/i18n/routing'

/**
 * Callback Supabase Auth — gère 3 flux :
 *   1. PKCE (OAuth Google/Apple, et magic link en mode @supabase/ssr) : `?code=…`
 *   2. Hash flow (email verification legacy)                          : `#access_token=…`
 *   3. Erreur provider                                                : `?error=…`
 *
 * Une fois la session posée, on redirige :
 *   - admin → /admin
 *   - sinon → `next` (querystring) → sessionStorage `redirect_to` → `/`
 *
 * Le query param `locale` (passé par `OAuthButtons`) est utilisé pour préfixer
 * la cible si `next` est un chemin non-localisé.
 */
function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Vérification de la session…')

  useEffect(() => {
    const run = async () => {
      try {
        // 1. Erreurs OAuth explicites (state mismatch, user refused, etc.)
        const providerError = searchParams.get('error')
        if (providerError) {
          logger.error('OAuth provider error:', providerError, searchParams.get('error_description'))
          router.replace(`/login?error=oauth_failed`)
          return
        }

        // 2. PKCE code flow — échange explicite contre une session
        const code = searchParams.get('code')
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code)
          if (exchErr) {
            logger.error('exchangeCodeForSession error:', exchErr)
            router.replace(`/login?error=oauth_failed`)
            return
          }
        } else {
          // 3. Hash flow — la SDK Supabase pose la session côté client.
          //    Petit délai pour laisser cookies/localStorage se poser.
          await new Promise((resolve) => setTimeout(resolve, 600))
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          logger.error('Callback session error:', sessionError)
          router.replace('/login?error=session_error')
          return
        }
        if (!session) {
          router.replace('/login')
          return
        }

        setStatus('Session trouvée, vérification des permissions…')

        const { data: isAdminRpc, error: rpcError } = await supabase.rpc('is_user_admin', {
          check_user_id: session.user.id,
        })
        if (rpcError) logger.warn('Callback is_user_admin error:', rpcError)

        const isAdmin =
          isAdminRpc === true ||
          session.user.app_metadata?.role === 'admin'

        let destination: string
        if (isAdmin) {
          destination = ADMIN_HOME_PATH
        } else {
          const nextParam = searchParams.get('next')
          const localeParam = searchParams.get('locale')
          const stored =
            typeof window !== 'undefined' ? sessionStorage.getItem('redirect_to') : null
          let candidate = nextParam ?? stored ?? '/'

          // S'assurer que la cible commence bien par /
          if (!candidate.startsWith('/')) candidate = `/${candidate}`

          // Préfixer la locale si manquante
          const localePrefix = candidate.match(/^\/([a-z]{2})(\/|$)/i)?.[1]?.toLowerCase()
          const isLocalized = localePrefix
            ? (routing.locales as readonly string[]).includes(localePrefix)
            : false

          if (!isLocalized) {
            const targetLocale =
              localeParam && (routing.locales as readonly string[]).includes(localeParam)
                ? localeParam
                : routing.defaultLocale
            candidate = candidate === '/' ? `/${targetLocale}` : `/${targetLocale}${candidate}`
          }

          destination = candidate

          try {
            sessionStorage.removeItem('redirect_to')
          } catch {
            // ignored
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 200))
        router.replace(destination)
      } catch (err) {
        logger.error('Callback unexpected error:', err)
        router.replace('/login?error=callback_error')
      }
    }

    run()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-200">
      <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-sand-300 border-t-clay-700 mx-auto" />
        <p className="mt-4 text-ink-800 font-medium">{status}</p>
        <p className="mt-2 text-sm text-ink-500">Veuillez patienter…</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackInner />
    </Suspense>
  )
}
