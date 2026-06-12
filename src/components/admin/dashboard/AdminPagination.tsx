'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { buildPageRange } from '@/lib/pagination'

type AdminPaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const TILE =
  'inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-md border text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700'
const TILE_IDLE = 'bg-sand-50 text-ink-700 border-sand-300 hover:bg-sand-100 hover:text-ink-900'
// aria-disabled (et non disabled) : le bouton reste focusable — sinon, quand
// ‹/› se désactive sous le focus après activation, le focus tombe sur <body>
// (perte de position clavier/lecteur d'écran). Le handler fait la garde.
const TILE_CHEVRON = `${TILE} ${TILE_IDLE} aria-disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-sand-50 aria-disabled:hover:text-ink-700`

/** Hauteur du chrome sticky au-dessus des tables admin (PageHeader + filterbar). */
const STICKY_OFFSET = 150

/**
 * Pied de pagination partagé des tables admin : « Page X sur Y » à gauche,
 * navigation `‹ 1 … 4 [5] 6 … 36 ›` à droite (fenêtre glissante via
 * buildPageRange — fini les 36 boutons à plat). À rendre comme DERNIER enfant
 * de la carte de table (il pose son border-t, et ramène le HAUT de la carte
 * — son parentElement — en vue à chaque changement de page : sans ça, on
 * atterrit au pied de la nouvelle page). Rendu nul s'il n'y a qu'une page.
 */
export function AdminPagination({ page, totalPages, onPageChange }: AdminPaginationProps) {
  const t = useTranslations('Admin.common')
  const wrapRef = useRef<HTMLDivElement>(null)
  if (totalPages <= 1) return null

  const goTo = (p: number) => {
    if (p === page || p < 1 || p > totalPages) return
    onPageChange(p)
    const card = wrapRef.current?.parentElement ?? wrapRef.current
    if (card) {
      const top = card.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET
      window.scrollTo({ top: Math.max(0, top) })
    }
  }

  return (
    <div
      ref={wrapRef}
      className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-5 py-3.5 bg-sand-50 border-t border-sand-200 text-[12.5px] text-ink-700"
    >
      <span>{t('pageOf', { page, total: totalPages })}</span>
      <nav aria-label={t('pagination')} className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          aria-disabled={page <= 1}
          aria-label={t('prevPage')}
          className={TILE_CHEVRON}
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
        </button>
        {buildPageRange(page, totalPages, 1).map((entry, idx) =>
          entry === 'ellipsis' ? (
            <span
              key={`e-${idx}`}
              aria-hidden
              className="inline-flex items-center justify-center min-w-[24px] h-8 text-ink-500 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => goTo(entry)}
              aria-label={t('pageAria', { page: entry })}
              aria-current={page === entry ? 'page' : undefined}
              className={`${TILE} ${
                page === entry ? 'bg-ink-900 text-sand-50 border-ink-900 font-medium' : TILE_IDLE
              }`}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => goTo(page + 1)}
          aria-disabled={page >= totalPages}
          aria-label={t('nextPage')}
          className={TILE_CHEVRON}
        >
          <ChevronRight className="w-3.5 h-3.5" aria-hidden />
        </button>
      </nav>
    </div>
  )
}
