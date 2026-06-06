'use client'

import { useEffect, useState } from 'react'
import { Mail, Globe, CheckCircle2, AlertOctagon } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PreferencesFormProps {
  initialPreferredLocale: 'fr' | 'en' | 'es' | null
}

type LocaleValue = 'auto' | 'fr' | 'en' | 'es'
type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'success' } | { kind: 'error'; msg: string }

export function PreferencesForm({ initialPreferredLocale }: PreferencesFormProps) {
  const t = useTranslations('Account.preferences')

  // ── Newsletter ──
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [nlStatus, setNlStatus] = useState<Status>({ kind: 'idle' })

  // ── Locale ──
  const [locale, setLocale] = useState<LocaleValue>(initialPreferredLocale ?? 'auto')
  const [localeStatus, setLocaleStatus] = useState<Status>({ kind: 'idle' })

  useEffect(() => {
    let cancelled = false
    fetch('/api/newsletter')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { subscribed?: boolean } | null) => {
        if (!cancelled && d && typeof d.subscribed === 'boolean') {
          setSubscribed(d.subscribed)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleToggleNewsletter = async () => {
    if (subscribed === null) return
    setNlStatus({ kind: 'saving' })

    try {
      if (subscribed) {
        const res = await fetch('/api/newsletter', { method: 'DELETE' })
        if (!res.ok) throw new Error()
        setSubscribed(false)
      } else {
        // Note : on lit l'email via /api/newsletter GET 401 ne donne pas
        // l'email. On laisse l'API serveur faire le lookup user.email.
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}), // POST publique attend { email, lang } — voir gestion ci-dessous
        })
        if (!res.ok) throw new Error()
        setSubscribed(true)
      }
      setNlStatus({ kind: 'success' })
      setTimeout(() => setNlStatus({ kind: 'idle' }), 2000)
    } catch {
      setNlStatus({ kind: 'error', msg: t('newsletterError') })
    }
  }

  const handleSaveLocale = async () => {
    setLocaleStatus({ kind: 'saving' })
    const value = locale === 'auto' ? null : locale
    try {
      const res = await fetch('/api/account/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_locale: value }),
      })
      if (!res.ok) throw new Error()
      setLocaleStatus({ kind: 'success' })
      setTimeout(() => setLocaleStatus({ kind: 'idle' }), 2000)
    } catch {
      setLocaleStatus({ kind: 'error', msg: t('localeError') })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Newsletter */}
      <section className="bg-white border border-sand-300 rounded-md p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-sm bg-sand-100 flex items-center justify-center shrink-0">
            <Mail size={18} strokeWidth={1.7} className="text-clay-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-[22px] leading-tight -tracking-[0.01em] text-ink-900 mb-1">
              {t('newsletterHeading')}
            </h2>
            <p className="text-[14px] text-ink-700 leading-relaxed">
              {t('newsletterDescription')}
            </p>
          </div>
        </div>

        {subscribed === null ? (
          <p className="text-[13.5px] text-ink-500">{t('newsletterLoading')}</p>
        ) : (
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={subscribed}
              onChange={handleToggleNewsletter}
              disabled={nlStatus.kind === 'saving'}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                subscribed ? 'bg-clay-700' : 'bg-sand-400'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  subscribed ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </span>
            <span className="text-[14px] text-ink-800">
              {subscribed ? t('newsletterOn') : t('newsletterOff')}
            </span>
          </label>
        )}

        {nlStatus.kind === 'success' && (
          <p className="mt-3 flex items-center gap-2 text-[13.5px] text-olive-700">
            <CheckCircle2 size={16} strokeWidth={1.8} />
            {t('saved')}
          </p>
        )}
        {nlStatus.kind === 'error' && (
          <p className="mt-3 flex items-center gap-2 text-[13.5px] text-brick-600">
            <AlertOctagon size={16} strokeWidth={1.8} />
            {nlStatus.msg}
          </p>
        )}
      </section>

      {/* Locale */}
      <section className="bg-white border border-sand-300 rounded-md p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-sm bg-sand-100 flex items-center justify-center shrink-0">
            <Globe size={18} strokeWidth={1.7} className="text-clay-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-[22px] leading-tight -tracking-[0.01em] text-ink-900 mb-1">
              {t('localeHeading')}
            </h2>
            <p className="text-[14px] text-ink-700 leading-relaxed">
              {t('localeDescription')}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 max-w-xs">
            <label htmlFor="preferred-locale" className="block text-[13px] font-medium text-ink-700 mb-1.5">
              {t('localeLabel')}
            </label>
            <select
              id="preferred-locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value as LocaleValue)}
              className="w-full h-11 px-3 rounded-lg border border-sand-300 bg-sand-50 text-[14.5px] text-ink-900 focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-[3px] focus-visible:ring-clay-700/20 transition-colors"
            >
              <option value="auto">{t('localeAuto')}</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleSaveLocale}
            disabled={localeStatus.kind === 'saving'}
            className="inline-flex items-center justify-center px-5 h-11 rounded-sm bg-clay-700 hover:bg-clay-800 text-on-accent text-[12.5px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {localeStatus.kind === 'saving' ? t('saving') : t('saveLocaleCta')}
          </button>
        </div>

        {localeStatus.kind === 'success' && (
          <p className="mt-3 flex items-center gap-2 text-[13.5px] text-olive-700">
            <CheckCircle2 size={16} strokeWidth={1.8} />
            {t('saved')}
          </p>
        )}
        {localeStatus.kind === 'error' && (
          <p className="mt-3 flex items-center gap-2 text-[13.5px] text-brick-600">
            <AlertOctagon size={16} strokeWidth={1.8} />
            {localeStatus.msg}
          </p>
        )}
      </section>
    </div>
  )
}
