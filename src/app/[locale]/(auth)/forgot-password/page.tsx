'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { supabase } from '@/lib/supabaseClient'
import { AuthLayout, AuthNotice } from '@/components/auth/AuthLayout'

export default function ForgotPasswordPage() {
  const t = useTranslations('ForgotPassword')
  const tAuth = useTranslations('Auth')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (typeof window !== 'undefined' ? window.location.origin : '')
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    })
    // Toujours afficher le success (anti user enumeration)
    setLoading(false)
    setSent(true)
  }

  return (
    <AuthLayout quote={t('aside.quote')}>
      <h1 className="font-serif text-[36px] leading-[1.1] tracking-[-0.01em] text-ink-900">
        {t('title')}
      </h1>
      <p className="text-[14.5px] text-ink-700 leading-relaxed -mt-2">
        {t('lede')}
      </p>

      {sent ? (
        <>
          <AuthNotice variant="ok">
            <strong className="block mb-1">{t('successTitle')}</strong>
            {t('successBody')}
          </AuthNotice>
          <p className="text-[12px] text-ink-500">{t('retryHint')}</p>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[13px] font-medium text-ink-700">
              {t('emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="h-11 px-3 rounded-lg border border-sand-300 bg-sand-50
                         text-[14.5px] text-ink-900 placeholder:text-ink-500
                         focus-visible:outline-none focus-visible:border-clay-700
                         focus:ring-[3px] focus:ring-clay-700/20 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-lg bg-clay-700 text-on-accent text-[14.5px] font-medium
                       hover:bg-clay-800 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('submitLoading') : t('submitButton')}
          </button>
        </form>
      )}

      <Link
        href="/login"
        className="text-[13px] text-ink-700 border-b border-transparent hover:border-current pb-0.5 self-start transition-colors"
      >
        {tAuth('backToLogin')}
      </Link>
    </AuthLayout>
  )
}
