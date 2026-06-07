'use client'

import { Check, MoreHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Reservation } from './types'
import {
  ORIGIN_CHIP_CLASS,
  STATUS_BADGE_CLASS,
  buildReservationRef,
  fmtDOP,
  nextStatusFor,
} from './types'
import { useReservationFormat } from './useReservationFormat'

type Props = {
  rows: Reservation[]
  selectedIds: Set<string>
  expandedId: string | null
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[], select: boolean) => void
  onOpenDetail: (id: string) => void
  onWhatsapp: (r: Reservation) => void
  onAdvance: (r: Reservation) => void
  /** Colonne date : date de création (défaut) ou de retrait (journal des ventes). */
  dateField?: 'created_at' | 'collected_at'
}

export function ReservationsTable({
  rows,
  selectedIds,
  expandedId,
  onToggleSelect,
  onSelectAll,
  onOpenDetail,
  onWhatsapp,
  onAdvance,
  dateField = 'created_at',
}: Props) {
  const t = useTranslations('Admin.reservations')
  const { statusLabel, relativeAndAbsolute, originLabel, displayName } = useReservationFormat()
  const allChecked = rows.length > 0 && rows.every((r) => selectedIds.has(r.id))
  const someChecked = rows.some((r) => selectedIds.has(r.id))

  return (
    <div className="bg-sand-50 overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: 34 }} />
          <col style={{ width: 170 }} />
          <col style={{ width: 220 }} />
          <col style={{ width: 80 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 140 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 110 }} />
        </colgroup>
        <thead className="bg-sand-100 border-b border-sand-300">
          <tr>
            <Th>
              <button
                type="button"
                onClick={() =>
                  onSelectAll(
                    rows.map((r) => r.id),
                    !allChecked,
                  )
                }
                aria-label={allChecked ? t('deselectAll') : t('selectAll')}
                className={`w-[18px] h-[18px] rounded-[4px] inline-flex items-center justify-center text-[11px] font-semibold transition-colors ${
                  allChecked
                    ? 'bg-ink-900 border-2 border-ink-900 text-sand-50'
                    : someChecked
                      ? 'bg-clay-200 border-2 border-clay-700 text-clay-700'
                      : 'bg-sand-50 border-2 border-sand-500 text-transparent'
                }`}
              >
                {allChecked ? '✓' : someChecked ? '—' : ''}
              </button>
            </Th>
            <Th>{t('col.reference')}</Th>
            <Th>{t('col.client')}</Th>
            <Th align="center">{t('col.items')}</Th>
            <Th align="right">{t('col.total')}</Th>
            <Th align="center">{t('col.status')}</Th>
            <Th>{t('col.date')}</Th>
            <Th align="center">{t('col.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const ref = buildReservationRef(r.id, r.created_at)
            const checked = selectedIds.has(r.id)
            const selected = checked || expandedId === r.id
            const dateInfo = relativeAndAbsolute(
              (dateField === 'collected_at' ? r.collected_at : null) ?? r.created_at,
            )
            const next = nextStatusFor(r.status)
            return (
              <tr
                key={r.id}
                className={`relative cursor-pointer transition-colors ${
                  selected ? 'bg-clay-50' : 'hover:bg-sand-100'
                } border-b border-sand-200`}
                onClick={(e) => {
                  // ignore les clics sur la checkbox + le bloc actions
                  const target = e.target as HTMLElement
                  if (target.closest('[data-stop-row-click]')) return
                  onOpenDetail(r.id)
                }}
              >
                {selected && checked && (
                  <td
                    aria-hidden
                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-clay-700 p-0 border-0"
                    style={{ width: 3 }}
                  />
                )}
                <Td>
                  <button
                    type="button"
                    onClick={() => onToggleSelect(r.id)}
                    aria-label={checked ? t('deselectRow') : t('selectRow')}
                    data-stop-row-click
                    className={`w-[18px] h-[18px] rounded-[4px] inline-flex items-center justify-center text-[11px] font-semibold transition-colors ${
                      checked
                        ? 'bg-ink-900 border-2 border-ink-900 text-sand-50'
                        : 'bg-sand-50 border-2 border-sand-500 text-transparent'
                    }`}
                  >
                    {checked ? '✓' : ''}
                  </button>
                </Td>
                <Td>
                  <span className="font-mono text-[12px] text-ink-700 font-medium">
                    {ref}
                  </span>
                </Td>
                <Td>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-ink-900 text-[13.5px] flex items-center gap-1.5 truncate">
                      {displayName(r.contact_name, r.source)}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11.5px] text-ink-500 font-mono min-w-0">
                      <span className="truncate">{r.contact_phone || '—'}</span>
                      {r.source !== 'account' && (
                        <span
                          className={`shrink-0 px-1.5 py-px rounded-full text-[9px] font-sans font-semibold uppercase tracking-[0.04em] ${ORIGIN_CHIP_CLASS[r.source]}`}
                        >
                          {originLabel(r.source)}
                        </span>
                      )}
                    </span>
                  </div>
                </Td>
                <Td align="center">
                  <span className="font-serif text-[18px] text-ink-900 leading-none">
                    {r.total_items}
                    <small className="block font-sans text-[10px] text-ink-500 tracking-[0.06em] mt-0">
                      {t('unit', { count: r.total_items })}
                    </small>
                  </span>
                </Td>
                <Td align="right">
                  <span className="font-serif text-[16px] text-ink-900 whitespace-nowrap">
                    {fmtDOP(r.total_price)}
                    <small className="font-sans text-[10.5px] text-ink-500 ml-1">DOP</small>
                  </span>
                </Td>
                <Td align="center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
                      STATUS_BADGE_CLASS[r.status]
                    }`}
                  >
                    {statusLabel(r.status)}
                  </span>
                </Td>
                <Td>
                  <span className="text-[12px] text-ink-700 leading-[1.4]">
                    {dateInfo.rel}
                    <small className="block text-[10.5px] text-ink-500 tracking-[0.04em]">
                      {dateInfo.abs}
                    </small>
                  </span>
                </Td>
                <Td>
                  <div
                    className="flex justify-center gap-1.5 items-center"
                    data-stop-row-click
                  >
                    {r.contact_phone && (
                      <RowAction
                        title={t('action.whatsapp')}
                        hoverClass="hover:text-[#25D366]"
                        onClick={() => onWhatsapp(r)}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M20.5 3.4C18.3 1.2 15.3 0 12.1 0 5.5 0 .2 5.3.2 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.7 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.4z" />
                        </svg>
                      </RowAction>
                    )}
                    {next && (
                      <RowAction
                        title={next === 'confirmed' ? t('markAs.confirmed') : t('markAs.collected')}
                        hoverClass="hover:text-clay-700"
                        onClick={() => onAdvance(r)}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </RowAction>
                    )}
                    <RowAction
                      title={t('action.detail')}
                      onClick={() => onOpenDetail(r.id)}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </RowAction>
                  </div>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode
  align?: 'right' | 'center'
}) {
  return (
    <th
      className={`px-3 py-2.5 text-[11px] tracking-[0.12em] uppercase text-ink-500 font-semibold whitespace-nowrap border-b border-sand-300 ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  align,
}: {
  children: React.ReactNode
  align?: 'right' | 'center'
}) {
  return (
    <td
      className={`px-3 py-3.5 align-middle ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      }`}
    >
      {children}
    </td>
  )
}

function RowAction({
  title,
  children,
  hoverClass,
  onClick,
}: {
  title: string
  children: React.ReactNode
  hoverClass?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      data-stop-row-click
      className={`w-7 h-7 rounded inline-flex items-center justify-center text-ink-500 hover:bg-sand-200 hover:text-ink-900 transition-colors ${
        hoverClass ?? ''
      }`}
    >
      {children}
    </button>
  )
}
