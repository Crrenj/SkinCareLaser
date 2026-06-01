'use client'

import { useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'

type Status = 'idle' | 'submitting' | 'success' | 'error'

/**
 * Section newsletter (`.news`) — bande claire sand-100 juste avant le footer
 * sombre. Titre serif + champ + bouton ink. POST /api/newsletter, optimistic.
 */
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
    <section className="bg-sand-100 border-t border-sand-300">
      <div className="mx-auto max-w-[1440px] px-[clamp(20px,6vw,104px)] py-[clamp(48px,7vw,96px)] grid lg:grid-cols-[1fr_auto] gap-[clamp(32px,5vw,72px)] items-end">
        <div>
          <h2
            className="font-serif font-normal text-[clamp(32px,4vw,52px)] leading-none -tracking-[0.02em] text-ink-900 mb-3.5 [&_em]:italic [&_em]:text-clay-700"
            dangerouslySetInnerHTML={{ __html: t.raw('title') as string }}
          />
          <p className="text-[15px] leading-relaxed text-ink-700 max-w-[44ch]">
            {t('description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 min-w-[min(420px,80vw)]">
          <div className="flex gap-2">
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
              className="flex-1 bg-sand-50 border border-sand-400 rounded-[2px] px-4 py-3.5 text-sm text-ink-900 placeholder:text-ink-500 outline-none focus-visible:border-clay-700 transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
              className="bg-ink-900 hover:bg-clay-800 text-sand-50 rounded-[2px] px-6 py-3.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? t('submitting') : t('submit')}
            </button>
          </div>
          <div id="newsletter-feedback" aria-live="polite">
            {status === 'success' ? (
              <p className="font-mono text-[10.5px] tracking-[0.04em] text-olive-600">{t('success')}</p>
            ) : status === 'error' && errorMsg ? (
              <p className="font-mono text-[10.5px] tracking-[0.04em] text-brick-600">{errorMsg}</p>
            ) : (
              <span className="font-mono text-[10.5px] tracking-[0.04em] text-ink-500">{t('fine')}</span>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
