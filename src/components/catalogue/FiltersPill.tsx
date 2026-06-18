'use client'

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
 * Décalage bas qui tient compte de DEUX obstacles au bas de l'écran :
 *  1. le home-indicator iOS — `env(safe-area-inset-bottom)` ;
 *  2. la barre d'outils basse du navigateur (Safari iOS bottom URL bar), mesurée
 *     par `useBrowserBottomInset` → `--browser-bottom-inset` (env() ne la couvre
 *     PAS → sans ça la pilule est à moitié derrière elle et inerte).
 *
 * Le 3ᵉ obstacle — le bandeau cookies pleine largeur (z-60 > pilule z-26) qui
 * l'intercepterait au premier passage — est géré en MASQUANT la pilule tant que
 * le bandeau est ouvert (cf. `.farmau-mobile-filter-pill` + `CookieBanner`),
 * plutôt qu'en la propulsant au-dessus (elle finirait en plein milieu d'écran).
 */
const safeBottom = (base: number) =>
  `calc(${base}px + max(env(safe-area-inset-bottom, 0px), var(--browser-bottom-inset, 0px)))`

/**
 * Pilule sticky "Filtros (n)" + row pills actives juste au-dessus, mobile only.
 * Toujours visible (plus d'auto-hide au scroll : sur un catalogue on scrolle
 * vers le bas en permanence, masquer l'unique accès aux filtres est hostile et
 * rendait le bouton difficile à atteindre).
 */
export function FiltersPill({ groupCount, activeFilters, onOpen, hidden }: Props) {
  const t = useTranslations('MobileFilters')

  if (hidden) return null

  return (
    <div className="farmau-mobile-filter-pill lg:hidden pointer-events-none">
      {activeFilters.length > 0 && (
        <div
          className="fixed left-3 right-3 z-[25] flex gap-1.5 overflow-x-auto pointer-events-auto px-1 py-0.5"
          style={{ bottom: safeBottom(80), scrollSnapType: 'x mandatory' }}
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
        className="fixed left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-ink-900 text-sand-50 px-5 py-2.5 rounded-full text-[13.5px] font-medium shadow-[0_10px_24px_-8px_rgba(31,27,22,0.45)] z-[26] pointer-events-auto"
        style={{ bottom: safeBottom(24) }}
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
