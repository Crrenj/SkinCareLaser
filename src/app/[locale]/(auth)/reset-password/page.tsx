'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { supabase } from '@/lib/supabaseClient'
import { AuthLayout, AuthNotice } from '@/components/auth/AuthLayout'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { PasswordStrength } from '@/components/auth/PasswordStrength'

const MIN_PASSWORD_LENGTH = 12

type Stage = 'verifying' | 'form' | 'expired' | 'success'
type ResetErrorKey = 'tooShort' | 'mismatch' | 'expired' | 'missingToken' | 'generic' | 'emailInvalid'

function ResetPasswordForm() {
  const t = useTranslations('ResetPassword')
  const tAuth = useTranslations('Auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  // Mode « configuration de compte » (lien envoyé au client après création
  // express au comptoir) : on demande aussi un vrai email pour un login propre.
  const setup = searchParams.get('setup') === '1'

  const [stage, setStage] = useState<Stage>('verifying')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<ResetErrorKey | null>(null)
  const [loading, setLoading] = useState(false)

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    // 1) Supabase redirige avec ?error=… (lien expiré ou invalide)
    const queryError = searchParams.get('error')
    if (queryError) {
      setStage('expired')
      return
    }

    // 2) Hash flow Supabase : `#access_token=...&type=recovery`
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      // Supabase pose la session via le hash automatiquement
      setStage('form')
      return
    }

    // 3) PKCE flow : ?code=… (échangé par exchangeCodeForSession)
    const code = searchParams.get('code')
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error: exchErr }) => {
          if (exchErr) {
            setStage('expired')
          } else {
            setStage('form')
          }
        })
        .catch(() => setStage('expired'))
      return
    }

    // 4) Aucun token : session déjà active ? sinon → expired
    supabase.auth.getSession().then(({ data }) => {
      setStage(data.session ? 'form' : 'expired')
    })
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError('tooShort')
      return
    }
    if (password !== confirm) {
      setError('mismatch')
      return
    }
    if (setup && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('emailInvalid')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser(
      setup ? { email: email.trim(), password } : { password },
    )
    setLoading(false)

    if (updateError) {
      if (
        updateError.message.toLowerCase().includes('expired') ||
        updateError.message.toLowerCase().includes('invalid')
      ) {
        setStage('expired')
        return
      }
      setError('generic')
      return
    }

    setStage('success')
    setTimeout(() => router.push('/'), 1600)
  }

  const canSubmit =
    !loading &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password === confirm &&
    (!setup || email.trim().length > 3)

  return (
    <AuthLayout quote={t('aside.quote')}>
      {stage === 'verifying' && (
        <>
          <h1 className="font-serif text-[36px] leading-[1.1] tracking-[-0.01em] text-ink-900">
            {t('title')}
          </h1>
          <p className="text-[14.5px] text-ink-700">{t('verifying')}</p>
        </>
      )}

      {stage === 'expired' && (
        <>
          <h1 className="font-serif text-[36px] leading-[1.1] tracking-[-0.01em] text-ink-900">
            {t('expiredTitle')}
          </h1>
          <AuthNotice variant="error">
            <strong className="block mb-1">{t('errors.expired')}</strong>
            {t('expiredBody')}
          </AuthNotice>
          <Link
            href="/forgot-password"
            className="h-11 flex items-center justify-center rounded-lg bg-clay-700 text-on-accent text-[14.5px] font-medium hover:bg-accent-hover transition-colors"
          >
            {t('requestNewLink')}
          </Link>
          <Link
            href="/login"
            className="text-[13px] text-ink-700 text-center border-b border-transparent hover:border-current pb-0.5 self-center transition-colors"
          >
            {t('signInLink')}
          </Link>
        </>
      )}

      {stage === 'form' && (
        <>
          <h1 className="font-serif text-[36px] leading-[1.1] tracking-[-0.01em] text-ink-900">
            {setup ? t('setupTitle') : t('title')}
          </h1>
          <p className="text-[14.5px] text-ink-700 -mt-2">{setup ? t('setupLede') : t('lede')}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {setup && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="setup-email" className="text-[13px] text-ink-700 font-medium">
                  {t('emailLabel')}
                </label>
                <input
                  id="setup-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="h-11 px-3 rounded-lg border border-sand-300 bg-sand-50 text-[14.5px] text-ink-900 focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-[3px] focus-visible:ring-clay-700/20 transition-colors"
                />
              </div>
            )}
            <div>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label={t('newPasswordLabel')}
                hint={t('passwordHintInline')}
                placeholder="••••••••"
              />
              <PasswordStrength password={password} />
            </div>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              label={t('confirmPasswordLabel')}
              placeholder="••••••••"
            />

            {error && (
              <AuthNotice variant="error">{t(`errors.${error}`)}</AuthNotice>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="h-11 rounded-lg bg-clay-700 text-on-accent text-[14.5px] font-medium
                         hover:bg-accent-hover transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('submitLoading') : t('submitButton')}
            </button>
          </form>

          <Link
            href="/login"
            className="text-[13px] text-ink-700 border-b border-transparent hover:border-current pb-0.5 self-start transition-colors"
          >
            {tAuth('backToLogin')}
          </Link>
        </>
      )}

      {stage === 'success' && (
        <>
          <h1 className="font-serif text-[36px] leading-[1.1] tracking-[-0.01em] text-ink-900">
            {t('title')}
          </h1>
          <AuthNotice variant="ok">{t('successMessage')}</AuthNotice>
        </>
      )}
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
  const t = useTranslations('ResetPassword')
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-sand-100 text-ink-700">
          {t('verifying')}
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
