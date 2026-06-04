'use client'

import { AlertCircle } from 'lucide-react'
import type { MessageStats, StatusFilter, TicketStatus, TicketCategory, TicketPriority } from '../_lib/types'

export function statsCountFor(filter: StatusFilter, stats: MessageStats | null): number | undefined {
  if (!stats) return undefined
  if (filter === 'all') return stats.total
  return stats[filter]
}

export function Kpi({
  label, value, accent = 'ink',
}: {
  label: string; value: number; accent?: 'ink' | 'clay' | 'olive' | 'ochre'
}) {
  const cls =
    accent === 'clay' ? 'text-clay-700'
    : accent === 'olive' ? 'text-olive-600'
    : accent === 'ochre' ? 'text-[#B5852B]'
    : 'text-ink-900'
  return (
    <div className="bg-sand-50 border border-sand-300 rounded-xl px-4 py-3.5">
      <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500 mb-1.5">{label}</div>
      <span className={`font-serif text-[26px] leading-none ${cls}`}>{value}</span>
    </div>
  )
}

// Statut du cycle de ticket : open (à traiter) → in_progress → resolved → closed.
export function StatusPill({
  status, t,
}: {
  status: TicketStatus
  t: (key: string) => string
}) {
  const map = {
    open:        { bg: 'bg-clay-700/12',   text: 'text-clay-700',   dot: 'bg-clay-700',   labelKey: 'statusOpen' },
    in_progress: { bg: 'bg-[#B5852B]/14',  text: 'text-[#B5852B]',  dot: 'bg-[#B5852B]',  labelKey: 'statusInProgress' },
    resolved:    { bg: 'bg-olive-600/15',  text: 'text-olive-600',  dot: 'bg-olive-600',  labelKey: 'statusResolved' },
    closed:      { bg: 'bg-sand-300',      text: 'text-ink-700',    dot: 'bg-ink-500',    labelKey: 'statusClosed' },
  } as const
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium whitespace-nowrap ${s.bg} ${s.text}`}>
      <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {t(s.labelKey)}
    </span>
  )
}

// Catégorie du problème — chip outline + pastille de couleur par type.
export function CategoryBadge({
  category, t,
}: {
  category: TicketCategory
  t: (key: string) => string
}) {
  const map = {
    bug:     { dot: 'bg-brick-600',  labelKey: 'categoryBug' },
    order:   { dot: 'bg-clay-700',   labelKey: 'categoryOrder' },
    product: { dot: 'bg-olive-600',  labelKey: 'categoryProduct' },
    account: { dot: 'bg-ink-700',    labelKey: 'categoryAccount' },
    other:   { dot: 'bg-ink-400',    labelKey: 'categoryOther' },
  } as const
  const c = map[category]
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium whitespace-nowrap border border-sand-300 bg-sand-50 text-ink-700">
      <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {t(c.labelKey)}
    </span>
  )
}

export function PriorityIcon({
  priority, t,
}: {
  priority: TicketPriority
  t: (key: string) => string
}) {
  if (priority === 'urgent') return <AlertCircle className="w-3.5 h-3.5 text-brick-600 shrink-0" aria-label={t('priorityUrgent')} />
  if (priority === 'high') return <AlertCircle className="w-3.5 h-3.5 text-[#B5852B] shrink-0" aria-label={t('priorityHigh')} />
  return null
}
