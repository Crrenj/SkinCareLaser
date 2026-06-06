'use client'

import { useMemo } from 'react'

/**
 * Pagination compacte avec ellipsis, partagée par les tables admin
 * (réservations + ventes). Affiche au plus ~6 boutons : 1 … n-1 n.
 */
export function TablePagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  const pageButtons: (number | '…')[] = useMemo(() => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const out: (number | '…')[] = [1]
    if (page > 3) out.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i += 1) {
      out.push(i)
    }
    if (page < totalPages - 2) out.push('…')
    out.push(totalPages)
    return out
  }, [page, totalPages])

  return (
    <div className="flex gap-1 items-center">
      <PageBtn disabled={page === 1} onClick={() => onChange(page - 1)} label="‹" />
      {pageButtons.map((p, i) =>
        p === '…' ? (
          <span key={`${p}-${i}`} className="px-1 text-ink-500">
            …
          </span>
        ) : (
          <PageBtn key={p} active={p === page} onClick={() => onChange(p)} label={String(p)} />
        ),
      )}
      <PageBtn disabled={page === totalPages} onClick={() => onChange(page + 1)} label="›" />
    </div>
  )
}

function PageBtn({
  label,
  onClick,
  active,
  disabled,
}: {
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-[30px] h-[30px] rounded-md border text-[12.5px] inline-flex items-center justify-center transition-colors ${
        active
          ? 'bg-ink-900 text-sand-50 border-ink-900 font-semibold'
          : 'bg-sand-50 text-ink-700 border-sand-300 hover:bg-sand-200 hover:text-ink-900 disabled:opacity-40 disabled:hover:bg-sand-50 disabled:hover:text-ink-700 disabled:cursor-not-allowed'
      }`}
    >
      {label}
    </button>
  )
}
