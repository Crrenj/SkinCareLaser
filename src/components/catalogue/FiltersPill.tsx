'use client'

import { useEffect, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export type ActiveFilterPill = {
  /** Identifiant unique pour la suppression (ex: "brand:ISDIN"). */
  id: string
  /** Texte affiché. */
  label: string
  /** Callback au clic sur la croix → retire le filtre. */
  onRemove: () => void
}

type Props = {
  /** Nombre de groupes de filtres actifs (max ~5). 0 = pas de badge. */
  groupCount: number
  /** Pills horizontales représentant chaque filtre actif individuel. */
  activeFilters: ActiveFilterPill[]
  onOpen: () => void
  /** Désactive la pilule (catalogue vide). */
  hidden?: boolean
}

/**
 * Pilule sticky "Filtros (n)" + row pills actives juste au-dessus, mobile only.
 * Auto-hide quand l'utilisateur scrolle vers le bas (useScrollDirection),
 * réapparaît au scroll-up.
 */
export function FiltersPill({ groupCount, activeFilters, onOpen, hidden }: Props) {
  const t = useTranslations('MobileFilters')
  const direction = useScrollDirection()
  const dismissed = direction === 'down' && groupCount === 0

  if (hidden) return null

  return (
    <div className="lg:hidden pointer-events-none">
      {activeFilters.length > 0 && (
        <div
          className="fixed left-3 right-3 z-[25] flex gap-1.5 overflow-x-auto pointer-events-auto px-1 py-0.5"
          style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))', scrollSnapType: 'x mandatory' }}
        >
          {activeFilters.map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1.5 bg-sand-50 border border-sand-400 rounded-full px-2.5 py-1 text-[11px] text-ink-800 whitespace-nowrap shadow-[0_1px_2px_rgba(31,27,22,0.06)] shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              {f.label}
              <button
                type="button"
                onClick={f.onRemove}
                aria-label={t('removeFilterAriaLabel', { label: f.label })}
                className="text-ink-500 hover:text-brick-600 leading-none font-semibold transition-colors -my-0.5 px-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onOpen}
        aria-label={t('pillLabel')}
        className={`fixed left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-ink-900 text-sand-50 px-5 py-2.5 rounded-full text-[13.5px] font-medium shadow-[0_10px_24px_-8px_rgba(31,27,22,0.45)] z-[26] transition-transform duration-200 pointer-events-auto ${
          dismissed ? 'translate-y-[120%]' : 'translate-y-0'
        }`}
        style={{ bottom: 'calc(24px + env(safe-area-inset-bottom))' }}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>{t('pillLabel')}</span>
        {groupCount > 0 && (
          <span className="bg-clay-700 text-on-accent text-[11px] font-semibold px-1.5 py-px rounded-full leading-[1.4]">
            {groupCount}
          </span>
        )}
      </button>
    </div>
  )
}

/**
 * Détecte la direction de scroll (`up` ou `down`). Utilisé pour masquer
 * la pilule pendant un scroll-down passif et la réafficher au scroll-up.
 */
function useScrollDirection(): 'up' | 'down' {
  const [direction, setDirection] = useState<'up' | 'down'>('up')

  useEffect(() => {
    if (typeof window === 'undefined') return
    let lastY = window.scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        const y = window.scrollY
        if (Math.abs(y - lastY) > 6) {
          setDirection(y > lastY ? 'down' : 'up')
          lastY = y
        }
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return direction
}
