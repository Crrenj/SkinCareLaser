'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Loader2, UserRound, UserPlus, UserX } from 'lucide-react'

/** Choix d'identité client pour une vente/réservation au comptoir. */
export type CustomerSelection =
  | { mode: 'account'; userId: string; name: string; phone: string }
  | { mode: 'create'; firstName: string; lastName: string; phone: string }
  | { mode: 'anonymous' }
  | { mode: 'guest'; name: string; phone: string }

type Hit = { id: string; name: string; phone: string | null }

const inputCls =
  'w-full px-3 py-[10px] border border-sand-300 rounded-lg text-[13.5px] text-ink-900 bg-sand-50 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:shadow-[0_0_0_3px_rgba(142,82,50,.14)]'
const labelCls =
  'font-mono text-[10.5px] tracking-[0.12em] uppercase text-ink-700 font-semibold'

type Props = {
  /** `sale` → 3e option « anonyme » ; `reservation` → 3e option « invité » (tél requis). */
  context: 'sale' | 'reservation'
  value: CustomerSelection
  onChange: (v: CustomerSelection) => void
}

export function CustomerStep({ context, value, onChange }: Props) {
  const t = useTranslations('Admin.customers')
  const thirdMode: 'anonymous' | 'guest' = context === 'sale' ? 'anonymous' : 'guest'

  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [searching, setSearching] = useState(false)

  // Recherche client debounced (uniquement en mode « compte existant »).
  useEffect(() => {
    if (value.mode !== 'account' || value.userId) {
      setHits([])
      setSearching(false)
      return
    }
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      setSearching(false)
      return
    }
    setSearching(true)
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        })
        const json = await res.json()
        setHits(Array.isArray(json.results) ? json.results : [])
      } catch {
        if (!ctrl.signal.aborted) setHits([])
      } finally {
        if (!ctrl.signal.aborted) setSearching(false)
      }
    }, 220)
    return () => {
      ctrl.abort()
      clearTimeout(timer)
    }
  }, [query, value])

  function selectMode(mode: CustomerSelection['mode']) {
    setQuery('')
    setHits([])
    if (mode === 'account') onChange({ mode: 'account', userId: '', name: '', phone: '' })
    else if (mode === 'create') onChange({ mode: 'create', firstName: '', lastName: '', phone: '' })
    else if (mode === 'guest') onChange({ mode: 'guest', name: '', phone: '' })
    else onChange({ mode: 'anonymous' })
  }

  const tabs = [
    { mode: 'account' as const, label: t('modeAccount'), Icon: UserRound },
    { mode: 'create' as const, label: t('modeCreate'), Icon: UserPlus },
    {
      mode: thirdMode,
      label: t(thirdMode === 'anonymous' ? 'modeAnonymous' : 'modeGuest'),
      Icon: UserX,
    },
  ]

  return (
    <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px]">
      <div className="font-serif text-[17px] text-ink-900 mb-3">{t('section')}</div>

      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {tabs.map(({ mode, label, Icon }) => {
          const active = value.mode === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => selectMode(mode)}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-[11.5px] font-medium transition-colors ${
                active
                  ? 'bg-ink-900 text-sand-50 border-ink-900'
                  : 'bg-sand-50 text-ink-700 border-sand-300 hover:border-sand-500 hover:text-ink-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        })}
      </div>

      {/* Compte existant */}
      {value.mode === 'account' &&
        (value.userId ? (
          <div className="flex items-center justify-between gap-2 bg-clay-50 border border-clay-200 rounded-lg px-3 py-2.5">
            <span className="min-w-0">
              <span className="block text-[13px] text-ink-900 truncate">{value.name || '—'}</span>
              {value.phone && (
                <span className="block text-[11.5px] text-ink-500 font-mono truncate">{value.phone}</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => onChange({ mode: 'account', userId: '', name: '', phone: '' })}
              className="text-[11.5px] text-clay-700 hover:text-clay-800 underline underline-offset-2 shrink-0"
            >
              {t('change')}
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputCls} pl-9`}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clay-700 animate-spin" />
            )}
            {query.trim().length >= 2 && (hits.length > 0 || !searching) && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 bg-sand-50 border border-sand-300 rounded-lg overflow-hidden max-h-[240px] overflow-y-auto shadow-[0_8px_24px_rgba(0,0,0,.10)]">
                {hits.length === 0 ? (
                  <div className="px-3 py-3 text-[12.5px] text-ink-500">{t('searchEmpty')}</div>
                ) : (
                  hits.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() =>
                        onChange({ mode: 'account', userId: h.id, name: h.name, phone: h.phone ?? '' })
                      }
                      className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-sand-100 transition-colors border-b border-sand-200 last:border-b-0"
                    >
                      <span className="block text-[13px] text-ink-900 truncate">{h.name}</span>
                      {h.phone && (
                        <span className="font-mono text-[12px] text-ink-500 shrink-0">{h.phone}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ))}

      {/* Créer un compte express */}
      {value.mode === 'create' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>{t('firstNameLabel')}</label>
              <input
                type="text"
                value={value.firstName}
                onChange={(e) => onChange({ ...value, firstName: e.target.value })}
                className={inputCls}
                placeholder={t('firstNamePlaceholder')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>{t('lastNameLabel')}</label>
              <input
                type="text"
                value={value.lastName}
                onChange={(e) => onChange({ ...value, lastName: e.target.value })}
                className={inputCls}
                placeholder={t('lastNamePlaceholder')}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t('phoneLabel')}</label>
            <input
              type="tel"
              value={value.phone}
              onChange={(e) => onChange({ ...value, phone: e.target.value })}
              className={inputCls}
              placeholder={t('phonePlaceholder')}
            />
          </div>
          <p className="text-[11.5px] text-ink-500 leading-snug">{t('createHint')}</p>
        </div>
      )}

      {/* Anonyme (vente) */}
      {value.mode === 'anonymous' && (
        <p className="text-[12px] text-ink-500 leading-snug">{t('anonymousHint')}</p>
      )}

      {/* Invité (réservation — téléphone requis) */}
      {value.mode === 'guest' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t('nameLabel')}</label>
            <input
              type="text"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              className={inputCls}
              placeholder={t('namePlaceholder')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t('phoneLabel')}</label>
            <input
              type="tel"
              value={value.phone}
              onChange={(e) => onChange({ ...value, phone: e.target.value })}
              className={inputCls}
              placeholder={t('phonePlaceholder')}
            />
          </div>
          <p className="text-[11.5px] text-ink-500 leading-snug">{t('guestHint')}</p>
        </div>
      )}
    </div>
  )
}
