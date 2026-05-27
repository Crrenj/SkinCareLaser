'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'
import type { SortColumn, SortOrder } from '../_lib/types'

export function Kpi({
  label, value, icon, accent = 'clay',
}: {
  label: string; value: number; icon?: React.ReactNode; accent?: 'clay' | 'olive' | 'ochre' | 'brick'
}) {
  const cls = { clay: 'text-clay-700', olive: 'text-olive-600', ochre: 'text-[#B5852B]', brick: 'text-brick-600' }[accent]
  return (
    <div className="bg-sand-50 border border-sand-300 rounded-xl px-5 py-4">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500">{label}</span>
      </div>
      <span className={`font-serif text-[32px] leading-none ${cls}`}>{value}</span>
    </div>
  )
}

export function StockPill({
  status, tStockState,
}: {
  status: 'ok' | 'low' | 'out' | 'excess'
  tStockState: (key: 'ok' | 'low' | 'out' | 'excess') => string
}) {
  const map = {
    ok: { bg: 'bg-olive-600/15', text: 'text-olive-600', dot: 'bg-olive-600' },
    low: { bg: 'bg-[rgba(181,133,43,0.15)]', text: 'text-[#7A5A1C]', dot: 'bg-[#B5852B]' },
    out: { bg: 'bg-brick-600/12', text: 'text-brick-600', dot: 'bg-brick-600' },
    excess: { bg: 'bg-ink-200', text: 'text-ink-800', dot: 'bg-ink-500' },
  } as const
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${s.bg} ${s.text}`}>
      <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {tStockState(status)}
    </span>
  )
}

export function ThSort({
  children, column, current, order, onSort, align = 'left',
}: {
  children: React.ReactNode; column: SortColumn; current: SortColumn; order: SortOrder; onSort: (col: SortColumn) => void; align?: 'left' | 'right'
}) {
  const isOn = current === column
  return (
    <th
      className={`text-${align} px-4 py-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap cursor-pointer transition-colors ${isOn ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'}`}
      onClick={() => onSort(column)}
    >
      {children}
      {isOn && (
        <span className="inline-flex align-middle ml-1 text-clay-700">
          {order === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      )}
    </th>
  )
}
