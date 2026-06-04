'use client'

import { logger } from '@/lib/logger'
import { ADMIN_HOME_PATH } from '@/lib/constants'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { supabase } from '@/lib/supabaseClient'
import { AuthLayout, AuthDivider, AuthNotice } from '@/components/auth/AuthLayout'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { PasswordInput } from '@/components/auth/PasswordInput'

type LoginErrorKey =
  | 'unauthorized'
  | 'invalidCredentials'
  | 'oauth_failed'
  | 'session_error'
  | 'callback_error'
  | 'middleware_error'
  | 'generic'

function LoginForm() {
  const t = useTranslations('Login')
  const tOAuth = useTranslations('OAuth')
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<LoginErrorKey | null>(null)
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const errorParam = searchParams.get('error')
  const next = searchParams.get('next') ?? searchParams.get('redirectedFrom') ?? null

  useEffect(() => {
    if (errorParam) {
      const known: LoginErrorKey[] = [
        'unauthorized',
        'oauth_failed',
        'session_error',
        'callback_error',
        'middleware_error',
      ]
      if (known.includes(errorParam as LoginErrorKey)) {
        setError(errorParam as LoginErrorKey)
      }
    }
    if (next) {
      try {
        sessionStorage.setItem('redirect_to', next)
      } catch {
        // sessionStorage indisponible (navigation privée) — ignoré
      }
    }
  }, [errorParam, next])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(
          signInError.message.includes('Invalid login credentials')
            ? 'invalidCredentials'
            : 'generic',
        )
        setLoading(false)
        return
      }

      if (data.session) {
        const isAdminFromMeta = data.session.user.app_metadata?.role === 'admin'
        let isAdmin = isAdminFromMeta

        if (!isAdminFromMeta) {
          const { data: isAdminRpc } = await supabase.rpc('is_user_admin', {
            check_user_id: data.session.user.id,
          })
          isAdmin = isAdminRpc === true
        }

        setRedirecting(true)
        setLoading(false)

        // Destination explicite (deep-link ou redirect du middleware) prioritaire
        // pour TOUT LE MONDE : un admin n'est plus happé vers le dashboard s'il
        // visait une page précise (ex. agir comme client). Sans destination :
        // admin → dashboard, client → accueil.
        const savedRedirect =
          typeof window !== 'undefined' ? sessionStorage.getItem('redirect_to') : null
        const wanted = savedRedirect ?? next ?? null
        const redirectPath = wanted ?? (isAdmin ? ADMIN_HOME_PATH : '/')

        // Laisser un instant aux cookies de session de se poser
        await new Promise((resolve) => setTimeout(resolve, 400))

        try {
          sessionStorage.removeItem('redirect_to')
        } catch {
          // ignored
        }

        router.push(redirectPath)
      }
    } catch (err) {
      logger.error('Erreur login:', err)
      setError('generic')
      setLoading(false)
      setRedirecting(false)
    }
  }

  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'

  return (
    <AuthLayout quote={t('aside.quote')} cite={t('aside.cite')}>
      <h1 className="font-serif text-[36px] leading-[1.1] tracking-[-0.01em] text-ink-900">
        {t('title')}
      </h1>

      <OAuthButtons intent="login" next={next ?? '/'} />

      <AuthDivider label={tOAuth('dividerLabel')} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[13px] font-medium text-ink-700">
            {t('emailLabel')}
          </label>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            disabled={redirecting}
            aria-invalid={!!error}
            aria-describedby={error ? 'login-error' : undefined}
            className="h-11 px-3 rounded-lg border border-sand-300 bg-sand-50
                       text-[14.5px] text-ink-900 placeholder:text-ink-500
                       focus-visible:outline-none focus-visible:border-clay-700
                       focus:ring-[3px] focus:ring-clay-700/20 transition-colors
                       disabled:opacity-60"
          />
        </div>

        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          label={t('passwordLabel')}
          disabled={redirecting}
          aria-invalid={!!error}
          aria-describedby={error ? 'login-error' : undefined}
        />

        {error && <AuthNotice variant="error" id="login-error">{t(`errors.${error}`)}</AuthNotice>}

        {redirecting && (
          <AuthNotice variant="ok">{t('successMessage')}</AuthNotice>
        )}

        <button
          type="submit"
          disabled={loading || redirecting}
          className="h-11 rounded-lg bg-clay-700 text-sand-50 text-[14.5px] font-medium
                     hover:bg-clay-800 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? t('submitLoading')
            : redirecting
              ? t('submitRedirecting')
              : t('submitButton')}
        </button>
      </form>

      <div className="flex items-center justify-between text-[13px]">
        <Link
          href="/forgot-password"
          className="text-ink-700 border-b border-transparent hover:border-current pb-0.5 transition-colors"
        >
          {t('forgotPassword')}
        </Link>
        <Link
          href={signupHref}
          className="text-clay-700 underline underline-offset-4 hover:text-clay-800 font-medium"
        >
          {t('createAccount')}
        </Link>
      </div>
    </AuthLayout>
  )
}

export default function LoginPage() {
  const t = useTranslations('Login')
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-sand-100 text-ink-700">
          {t('loadingFallback')}
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
