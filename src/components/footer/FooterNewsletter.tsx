'use client'

import { useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'

type Status = 'idle' | 'submitting' | 'success' | 'error'

/** Formulaire newsletter — POST /api/newsletter. Optimistic, idempotent. */
export function FooterNewsletter() {
  const t = useTranslations('Footer.newsletter')
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang: locale }),
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null
        const code = json?.error
        if (code === 'invalid_email') setErrorMsg(t('errorEmail'))
        else if (code === 'rate_limited') setErrorMsg(t('errorRateLimit'))
        else setErrorMsg(t('errorGeneric'))
        setStatus('error')
        return
      }

      setStatus('success')
      setEmail('')
    } catch {
      setErrorMsg(t('errorGeneric'))
      setStatus('error')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-8 lg:gap-12 items-end pb-14 mb-14 border-b border-ink-800">
      <div>
        <h3
          className="font-serif text-[32px] md:text-[40px] leading-[1.05] -tracking-[0.02em] text-sand-50 mb-2 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-400"
          dangerouslySetInnerHTML={{ __html: t.raw('title') as string }}
        />
        <p className="font-serif italic text-[16px] md:text-[17px] leading-[1.5] text-ink-500 max-w-[440px]">
          {t('description')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto] gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          aria-invalid={status === 'error'}
          aria-describedby={status === 'error' || status === 'success' ? 'newsletter-feedback' : undefined}
          disabled={status === 'submitting' || status === 'success'}
          className="bg-ink-800 border border-ink-700 text-sand-50 placeholder:text-ink-500 rounded-sm px-4 py-3.5 text-sm outline-none focus:border-clay-600 transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'submitting' || status === 'success'}
          className="bg-clay-700 hover:bg-clay-800 text-sand-50 rounded-sm px-6 py-3.5 text-[12px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? t('submitting') : t('submit')}
        </button>
        <div id="newsletter-feedback" aria-live="polite" className="col-span-2">
          {status === 'success' && (
            <p className="mt-2 text-[13px] text-clay-400">{t('success')}</p>
          )}
          {status === 'error' && errorMsg && (
            <p className="mt-2 text-[13px] text-brick-600">{errorMsg}</p>
          )}
        </div>
      </form>
    </div>
  )
}
