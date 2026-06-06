'use client'

import { useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Mail } from 'lucide-react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

/**
 * Bande newsletter compacte (mock « Fiche produit modernisée ») — fond clair
 * clay-50 juste avant le footer sombre. Tuile icône + titre serif + sous-titre
 * à gauche, formulaire inline à droite. Moins imposante que l'ancienne bande
 * éditoriale. POST /api/newsletter, optimistic.
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
    <section className="bg-clay-50 border-t border-clay-200">
      <div className="mx-auto max-w-[1440px] px-[clamp(20px,6vw,104px)] py-9 flex flex-wrap items-center justify-between gap-x-12 gap-y-6">
        <div className="flex items-center gap-4 min-w-[260px]">
          <span className="w-[46px] h-[46px] rounded-xl bg-sand-50 border border-clay-200 flex items-center justify-center text-clay-700 shrink-0">
            <Mail size={22} strokeWidth={1.6} />
          </span>
          <div className="max-w-[34ch]">
            <h2
              className="font-serif font-normal text-[25px] leading-[1.1] -tracking-[0.01em] text-ink-900 [&_em]:italic [&_em]:text-clay-700"
              dangerouslySetInnerHTML={{ __html: t.raw('title') as string }}
            />
            <p className="text-[13px] leading-snug text-ink-700 mt-1">{t('description')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-w-[min(300px,80vw)] max-w-[460px]">
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
              className="flex-1 min-w-0 bg-sand-50 border border-sand-400 rounded-lg px-4 py-3 text-sm text-ink-900 placeholder:text-ink-500 outline-none focus-visible:border-clay-700 focus-visible:ring-2 focus-visible:ring-clay-700/15 transition-[border-color,box-shadow] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
              className="bg-clay-700 text-on-accent rounded-lg px-5 py-3 text-[12.5px] font-semibold uppercase tracking-[0.04em] hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {status === 'submitting' ? t('submitting') : t('submit')}
            </button>
          </div>
          <div id="newsletter-feedback" aria-live="polite" className="mt-1.5">
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
