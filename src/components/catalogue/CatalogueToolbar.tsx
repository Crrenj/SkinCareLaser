'use client'

import { useTranslations } from 'next-intl'
import type { ActiveFilterPill } from './FiltersPill'

export type SortKey = 'bestsellers' | 'az' | 'za' | 'price-asc' | 'price-desc'

type Props = {
  activeFilters: ActiveFilterPill[]
  onClearAll: () => void
  sort: SortKey
  onSortChange: (next: SortKey) => void
  /** Classes additionnelles (ex. `hidden lg:block` pour la masquer sur mobile —
   *  doit rester sur le <section> sticky lui-même, pas un wrapper court, sinon
   *  le sticky casse). */
  className?: string
}

/**
 * Sticky toolbar : chips de filtres actifs + dropdown de tri.
 * Le toggle grid/list n'est pas exposé tant qu'aucune vue liste n'est livrée.
 */
export function CatalogueToolbar({ activeFilters, onClearAll, sort, onSortChange, className = '' }: Props) {
  const t = useTranslations('Catalogue')
  const tSort = useTranslations('Filters.sortOptions')

  return (
    <section
      aria-label={t('activeFiltersLabel')}
      className={`sticky top-0 z-30 border-b border-sand-300 px-5 lg:px-10 py-4 bg-[rgba(251,248,244,0.94)] backdrop-blur-sm ${className}`}
    >
      <div className="max-w-[1480px] mx-auto flex items-center gap-3 flex-wrap">
        {activeFilters.length > 0 ? (
          <>
            <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-500 mr-1">
              {t('activeFiltersLabel')}
            </span>
            {activeFilters.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={f.onRemove}
                aria-label={t('removeFilterAriaLabel', { label: f.label })}
                className={`inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-[3px] text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700 ${
                  i === 0 ? 'bg-ink-900 text-sand-50 hover:bg-ink-800' : 'bg-clay-700 text-on-accent hover:bg-accent-hover'
                }`}
              >
                {f.label}
                <span
                  aria-hidden
                  className="w-[18px] h-[18px] inline-flex items-center justify-center rounded-[2px] bg-sand-50/15 hover:bg-sand-50/30 text-[14px] leading-none"
                >
                  ×
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={onClearAll}
              className="ml-1 text-[13px] text-ink-500 underline underline-offset-4 hover:text-clay-700 transition-colors"
            >
              {t('toolbarClearAll')}
            </button>
          </>
        ) : (
          <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-500">
            {t('gridCuration')}
          </span>
        )}

        <span className="ml-auto" />

        <div className="inline-flex items-center gap-3 text-[13px] text-ink-700">
          <span>{t('toolbarSort')}</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            aria-label={t('toolbarSort')}
            className="font-sans text-[13px] border border-sand-300 bg-sand-50 text-ink-900 pl-3 pr-8 py-1.5 rounded-[4px] appearance-none cursor-pointer focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-2 focus-visible:ring-clay-700/20"
            style={{
              backgroundImage:
                'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%235A5448\' stroke-width=\'2\'><path d=\'m6 9 6 6 6-6\'/></svg>")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            <option value="bestsellers">{tSort('bestsellers')}</option>
            <option value="az">{tSort('az')}</option>
            <option value="za">{tSort('za')}</option>
            <option value="price-asc">{tSort('priceAsc')}</option>
            <option value="price-desc">{tSort('priceDesc')}</option>
          </select>
        </div>
      </div>
    </section>
  )
}
