'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const STORAGE_KEY = 'farmau:cookies:consent'

/**
 * Bandeau d'information cookies — affiché tant que l'utilisateur n'a pas
 * fait de choix. Les cookies actuels sont strictement essentiels, donc
 * le bandeau est purement informatif (pas de blocage de tracking puisqu'il
 * n'y a pas de tracking).
 *
 * Choix persistés dans localStorage sous `farmau:cookies:consent` =
 * `accepted` | `rejected`.
 */
export function CookieBanner() {
  const t = useTranslations('Legal.cookieBanner')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (!stored) setVisible(true)
    } catch {
      // localStorage indisponible (navigation privée stricte) — on n'affiche pas
    }
  }, [])

  const persist = (value: 'accepted' | 'rejected') => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignored
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-body"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-6 md:left-auto md:right-6 md:max-w-[440px] z-[60] bg-sand-50 border border-sand-300 rounded-md shadow-[0_24px_48px_-20px_rgba(31,27,22,0.35)] p-5 lg:p-6"
    >
      <button
        type="button"
        onClick={() => persist('rejected')}
        aria-label={t('rejectLabel')}
        className="absolute top-3 right-3 w-8 h-8 rounded-sm text-ink-500 hover:bg-sand-200 hover:text-ink-900 flex items-center justify-center transition-colors"
      >
        <X size={18} strokeWidth={1.7} />
      </button>

      <div id="cookie-banner-title" className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-clay-700 font-semibold mb-2">
        {t('title')}
      </div>
      <p id="cookie-banner-body" className="text-[13.5px] leading-[1.55] text-ink-800 mb-4 pr-6">
        {t('body')}{' '}
        <Link
          href="/legal/cookies"
          className="underline underline-offset-2 text-clay-700 hover:text-clay-800"
        >
          {t('linkLabel')}
        </Link>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => persist('accepted')}
          className="inline-flex items-center px-4 py-2.5 rounded-sm bg-clay-700 hover:bg-clay-800 text-on-accent text-[12px] font-semibold uppercase tracking-wider transition-colors"
        >
          {t('acceptLabel')}
        </button>
        <button
          type="button"
          onClick={() => persist('rejected')}
          className="inline-flex items-center px-4 py-2.5 rounded-sm bg-transparent border border-sand-400 text-ink-700 hover:text-ink-900 hover:border-ink-700 text-[12px] font-semibold uppercase tracking-wider transition-colors"
        >
          {t('rejectLabel')}
        </button>
      </div>
    </div>
  )
}
