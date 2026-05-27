'use client'

import { AlertCircle } from 'lucide-react'
import type { MessageStats, StatusFilter } from '../_lib/types'

export function statsCountFor(filter: StatusFilter, stats: MessageStats | null): number | undefined {
  if (!stats) return undefined
  if (filter === 'all') return stats.total
  return stats[filter]
}

export function Kpi({
  label, value, accent = 'ink',
}: {
  label: string; value: number; accent?: 'ink' | 'clay' | 'olive'
}) {
  const cls = accent === 'clay' ? 'text-clay-700' : accent === 'olive' ? 'text-olive-600' : 'text-ink-900'
  return (
    <div className="bg-sand-50 border border-sand-300 rounded-xl px-4 py-3.5">
      <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500 mb-1.5">{label}</div>
      <span className={`font-serif text-[26px] leading-none ${cls}`}>{value}</span>
    </div>
  )
}

export function StatusPill({
  status, t,
}: {
  status: 'unread' | 'read' | 'replied' | 'archived'
  t: (key: string) => string
}) {
  const map = {
    unread: { bg: 'bg-clay-700/12', text: 'text-clay-700', dot: 'bg-clay-700', labelKey: 'statusUnread' },
    read: { bg: 'bg-ink-200', text: 'text-ink-800', dot: 'bg-ink-500', labelKey: 'statusRead' },
    replied: { bg: 'bg-olive-600/15', text: 'text-olive-600', dot: 'bg-olive-600', labelKey: 'statusReplied' },
    archived: { bg: 'bg-sand-300', text: 'text-ink-800', dot: 'bg-ink-500', labelKey: 'statusArchived' },
  } as const
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium whitespace-nowrap ${s.bg} ${s.text}`}>
      <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {t(s.labelKey)}
    </span>
  )
}

export function PriorityIcon({
  priority, t,
}: {
  priority: 'low' | 'normal' | 'high' | 'urgent'
  t: (key: string) => string
}) {
  if (priority === 'urgent') return <AlertCircle className="w-3.5 h-3.5 text-brick-600 shrink-0" aria-label={t('priorityUrgent')} />
  if (priority === 'high') return <AlertCircle className="w-3.5 h-3.5 text-[#B5852B] shrink-0" aria-label={t('priorityHigh')} />
  return null
}
