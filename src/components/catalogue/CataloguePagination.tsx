'use client'

import { useTranslations } from 'next-intl'

type Props = {
  currentPage: number
  totalPages: number
  /** Taille de page — affichée en libellé « {n} par page » (desktop). */
  perPage?: number
  onPageChange: (page: number) => void
  onPrevious: () => void
  onNext: () => void
}

function buildPageRange(
  current: number,
  total: number,
  siblings = 1,
): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const first = 1
  const last = total
  const start = Math.max(first + 1, current - siblings)
  const end = Math.min(last - 1, current + siblings)
  const out: Array<number | 'ellipsis'> = [first]
  if (start > first + 1) out.push('ellipsis')
  else if (start === first + 1) out.push(first + 1)
  for (let i = Math.max(start, first + 2); i <= end; i++) out.push(i)
  if (end < last - 1) out.push('ellipsis')
  else if (end === last - 1) out.push(last - 1)
  out.push(last)
  return out
}

export function CataloguePagination({
  currentPage,
  totalPages,
  perPage,
  onPageChange,
  onPrevious,
  onNext,
}: Props) {
  const t = useTranslations('Catalogue')
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label={t('paginationAriaLabel')}
      className="mt-14 pt-7 border-t border-sand-300 flex flex-col-reverse sm:flex-row items-start sm:items-center sm:justify-between gap-4 font-mono text-[12px] tracking-[0.06em] text-ink-500"
    >
      <span>{t('pagerInfo', { page: currentPage, total: totalPages })}</span>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          aria-label={t('previousPageAriaLabel')}
          className="inline-flex items-center justify-center h-9 px-3.5 border border-sand-300 rounded-[3px] font-mono text-[13px] text-ink-700 bg-sand-50 hover:border-ink-900 hover:text-ink-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-sand-300 disabled:hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
        >
          ‹ {t('previousPage')}
        </button>
        {buildPageRange(currentPage, totalPages, 1).map((entry, idx) =>
          entry === 'ellipsis' ? (
            <span
              key={`e-${idx}`}
              aria-hidden
              className="inline-flex items-center justify-center min-w-[24px] h-9 text-ink-500 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-label={t('pageAriaLabel', { page: entry })}
              aria-current={currentPage === entry ? 'page' : undefined}
              className={`inline-flex items-center justify-center min-w-[36px] h-9 px-2.5 border rounded-[3px] font-sans text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700 ${
                currentPage === entry
                  ? 'bg-ink-900 text-sand-50 border-ink-900 font-medium'
                  : 'bg-sand-50 text-ink-700 border-sand-300 hover:border-ink-900 hover:text-ink-900'
              }`}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage === totalPages}
          aria-label={t('nextPageAriaLabel')}
          className="inline-flex items-center justify-center h-9 px-3.5 border border-sand-300 rounded-[3px] font-mono text-[13px] text-ink-700 bg-sand-50 hover:border-ink-900 hover:text-ink-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-sand-300 disabled:hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
        >
          {t('nextPage')} ›
        </button>
      </div>
      {perPage !== undefined && (
        <span className="hidden sm:inline">{t('pagerPerPage', { count: perPage })}</span>
      )}
    </nav>
  )
}
