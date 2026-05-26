'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Reply,
  Archive,
  Trash2,
  AlertCircle,
  Search,
  EyeOff,
  Mail,
  Loader2,
  X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useModalA11y } from '@/hooks/useModalA11y'
import { useConfirmDialog } from '@/components/admin/ConfirmDialog'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'

interface ContactMessage {
  id: string
  user_email: string
  subject: string
  message: string
  status: 'unread' | 'read' | 'replied' | 'archived'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  admin_notes?: string
  created_at: string
  updated_at: string
  replied_at?: string
  user?: { email: string }
  replied_by_user?: { email: string }
}

interface MessageStats {
  total: number
  unread: number
  read: number
  replied: number
  archived: number
  today: number
  this_week: number
}

type StatusFilter = 'all' | 'unread' | 'read' | 'replied' | 'archived'

const FILTERS: Array<{ value: StatusFilter; labelKey: 'filterAll' | 'filterUnread' | 'filterRead' | 'filterReplied' | 'filterArchived' }> = [
  { value: 'all', labelKey: 'filterAll' },
  { value: 'unread', labelKey: 'filterUnread' },
  { value: 'read', labelKey: 'filterRead' },
  { value: 'replied', labelKey: 'filterReplied' },
  { value: 'archived', labelKey: 'filterArchived' },
]

export default function MessagesAdminPage() {
  const t = useTranslations('Admin.messages')
  const tCrumbs = useTranslations('Admin.crumbs')
  const tCommon = useTranslations('Admin.common')
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [stats, setStats] = useState<MessageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showMessageModal, setShowMessageModal] = useState(false)

  const messageDialogRef = useModalA11y(showMessageModal, () => setShowMessageModal(false))
  const { confirm, dialog: confirmDialog } = useConfirmDialog()

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const response = await fetch(`/api/admin/messages?${params}`)
      const data = await response.json()
      if (response.ok) {
        setMessages(data.messages || [])
        setStats(data.stats)
      } else {
        console.error('Erreur chargement messages:', data.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId, status: 'read' }),
      })
      if (response.ok) loadMessages()
    } catch (error) {
      console.error('Erreur marquer comme lu:', error)
    }
  }

  const changeStatus = async (messageId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: messageId,
          status: newStatus,
          replied_at: newStatus === 'replied' ? new Date().toISOString() : undefined,
        }),
      })
      if (response.ok) {
        loadMessages()
        setShowMessageModal(false)
      }
    } catch (error) {
      console.error('Erreur changement statut:', error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    const ok = await confirm(t('deleteConfirmBody'), {
      title: t('deleteConfirmTitle'),
      confirmLabel: t('deleteConfirmLabel'),
    })
    if (!ok) return
    try {
      const response = await fetch(`/api/admin/messages?id=${messageId}`, { method: 'DELETE' })
      if (response.ok) {
        loadMessages()
        setShowMessageModal(false)
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  const filteredMessages = messages.filter(
    (message) =>
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      <PageHeader
        crumbs={[
          { label: tCrumbs('admin'), href: '/admin' },
          { label: tCrumbs('ops') },
          { label: tCrumbs('messages') },
        ]}
        title={t('title')}
      />

      <div className="bg-sand-100 border-b border-sand-300 px-5 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 sticky top-[88px] z-[4]">
        <label className="flex items-center gap-2 bg-sand-50 border border-sand-300 rounded-md px-3 py-1.5 text-ink-700 min-w-0 flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="sr-only">{tCommon('search')}</span>
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[13.5px] text-ink-900 placeholder:text-ink-500"
          />
        </label>
        <div className="flex gap-1.5 items-center flex-wrap">
          {FILTERS.map((f) => {
            const active = statusFilter === f.value
            const count = statsCountFor(f.value, stats)
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-[12.5px] rounded-full border inline-flex items-center gap-1.5 transition-colors ${
                  active
                    ? 'bg-ink-900 text-sand-50 border-ink-900 font-medium'
                    : 'bg-sand-50 text-ink-700 border-sand-300 hover:border-sand-500 hover:text-ink-900'
                }`}
              >
                {t(f.labelKey)}
                {count !== undefined && (
                  <span className={`font-mono text-[10.5px] ${active ? 'opacity-85' : 'opacity-70'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 lg:px-8 py-6 flex flex-col gap-6">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <Kpi label={t('kpiTotal')} value={stats.total} />
            <Kpi label={t('kpiUnread')} value={stats.unread} accent="clay" />
            <Kpi label={t('kpiRead')} value={stats.read} />
            <Kpi label={t('kpiReplied')} value={stats.replied} accent="olive" />
            <Kpi label={t('kpiArchived')} value={stats.archived} />
            <Kpi label={t('kpiToday')} value={stats.today} accent="clay" />
            <Kpi label={t('kpiWeek')} value={stats.this_week} />
          </div>
        )}

        {loading ? (
          <div className="bg-sand-50 border border-sand-300 rounded-xl py-12 text-center text-ink-500 text-[13.5px]">
            <Loader2 className="w-5 h-5 mx-auto mb-3 animate-spin text-clay-700" />
            {tCommon('loading')}
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="bg-sand-50 border border-sand-300 rounded-xl py-14 text-center text-ink-500 text-[13.5px]">
            <Mail className="w-6 h-6 mx-auto mb-3 opacity-50" />
            {t('emptyState')}
          </div>
        ) : (
          <ul className="bg-sand-50 border border-sand-300 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(31,27,22,0.06),0_12px_32px_-8px_rgba(31,27,22,0.08)] divide-y divide-sand-200 list-none m-0 p-0">
            {filteredMessages.map((message) => {
              const isUnread = message.status === 'unread'
              return (
                <li key={message.id} className={isUnread ? 'bg-clay-50/50' : ''}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMessage(message)
                      setShowMessageModal(true)
                      if (isUnread) markAsRead(message.id)
                    }}
                    className="w-full text-left px-5 py-4 hover:bg-sand-100 transition-colors flex items-start gap-3 group"
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        isUnread ? 'bg-clay-700' : 'bg-transparent border border-sand-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <PriorityIcon priority={message.priority} t={t} />
                        <span
                          className={`text-[14px] truncate ${
                            isUnread ? 'font-semibold text-ink-900' : 'font-medium text-ink-800'
                          }`}
                        >
                          {message.subject}
                        </span>
                        <StatusPill status={message.status} t={t} />
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-ink-500 mb-1.5 flex-wrap font-mono">
                        <span className="truncate max-w-[260px]">{message.user_email}</span>
                        <span className="text-ink-500">·</span>
                        <span>{new Date(message.created_at).toLocaleDateString('es-DO')}</span>
                      </div>
                      <p className="text-[13px] text-ink-700 line-clamp-2 leading-[1.5]">
                        {message.message}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {showMessageModal && selectedMessage && (
        <div
          className="fixed inset-0 bg-ink-900/50 overflow-y-auto h-full w-full z-50 flex items-start justify-center px-4 py-12"
          onClick={() => setShowMessageModal(false)}
          aria-hidden="true"
        >
          <div
            ref={messageDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="messages-modal-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-sand-50 border border-sand-300 rounded-xl shadow-[0_24px_60px_-12px_rgba(31,27,22,0.35)] overflow-hidden"
          >
            <header className="px-6 py-5 border-b border-sand-300 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3
                  id="messages-modal-title"
                  className="font-serif text-[22px] text-ink-900 leading-tight m-0 mb-2"
                >
                  {selectedMessage.subject}
                </h3>
                <div className="flex items-center gap-2 text-[12px] text-ink-500 font-mono flex-wrap">
                  <span className="truncate">{selectedMessage.user_email}</span>
                  <span className="text-ink-500">·</span>
                  <span>
                    {new Date(selectedMessage.created_at).toLocaleString('es-DO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMessageModal(false)}
                aria-label={t('modalCloseAria')}
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-500 hover:bg-sand-200 hover:text-ink-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="px-6 py-5 flex flex-col gap-5">
              <section>
                <h4 className="text-[11px] tracking-[0.14em] uppercase text-ink-500 font-semibold mb-2">
                  {t('messageHeading')}
                </h4>
                <div className="bg-sand-100 border border-sand-300 rounded-md p-4 text-[14px] leading-[1.55] text-ink-800 whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </section>

              <div className="flex flex-wrap gap-2">
                <ModalAction onClick={() => changeStatus(selectedMessage.id, 'read')} icon={<EyeOff className="w-3.5 h-3.5" />}>
                  {t('actionMarkRead')}
                </ModalAction>
                <ModalAction
                  onClick={() => changeStatus(selectedMessage.id, 'replied')}
                  icon={<Reply className="w-3.5 h-3.5" />}
                  accent="olive"
                >
                  {t('actionMarkReplied')}
                </ModalAction>
                <ModalAction
                  onClick={() => changeStatus(selectedMessage.id, 'archived')}
                  icon={<Archive className="w-3.5 h-3.5" />}
                >
                  {t('actionArchive')}
                </ModalAction>
                <ModalAction
                  onClick={() => deleteMessage(selectedMessage.id)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  accent="brick"
                >
                  {t('actionDelete')}
                </ModalAction>
              </div>

              <div className="text-[11px] text-ink-500 border-t border-sand-300 pt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono">
                <span>
                  <b className="text-ink-700">{t('metaStatus')}</b>{' '}
                  {t(`status${capitalize(selectedMessage.status)}` as
                    | 'statusUnread'
                    | 'statusRead'
                    | 'statusReplied'
                    | 'statusArchived')}
                </span>
                <span>
                  <b className="text-ink-700">{t('metaPriority')}</b> {selectedMessage.priority}
                </span>
                {selectedMessage.replied_at && (
                  <span>
                    <b className="text-ink-700">{t('metaRepliedAt')}</b>{' '}
                    {new Date(selectedMessage.replied_at).toLocaleString('es-DO')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDialog}
    </>
  )
}

function statsCountFor(
  filter: StatusFilter,
  stats: MessageStats | null,
): number | undefined {
  if (!stats) return undefined
  if (filter === 'all') return stats.total
  return stats[filter]
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function Kpi({
  label,
  value,
  accent = 'ink',
}: {
  label: string
  value: number
  accent?: 'ink' | 'clay' | 'olive'
}) {
  const accentClass =
    accent === 'clay' ? 'text-clay-700' : accent === 'olive' ? 'text-olive-600' : 'text-ink-900'
  return (
    <div className="bg-sand-50 border border-sand-300 rounded-xl px-4 py-3.5">
      <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500 mb-1.5">
        {label}
      </div>
      <span className={`font-serif text-[26px] leading-none ${accentClass}`}>{value}</span>
    </div>
  )
}

function StatusPill({
  status,
  t,
}: {
  status: 'unread' | 'read' | 'replied' | 'archived'
  t: ReturnType<typeof useTranslations>
}) {
  const map = {
    unread: { bg: 'bg-clay-700/12', text: 'text-clay-700', dot: 'bg-clay-700', labelKey: 'statusUnread' as const },
    read: { bg: 'bg-ink-200', text: 'text-ink-800', dot: 'bg-ink-500', labelKey: 'statusRead' as const },
    replied: { bg: 'bg-olive-600/15', text: 'text-olive-600', dot: 'bg-olive-600', labelKey: 'statusReplied' as const },
    archived: { bg: 'bg-sand-300', text: 'text-ink-800', dot: 'bg-ink-400', labelKey: 'statusArchived' as const },
  } as const
  const s = map[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium whitespace-nowrap ${s.bg} ${s.text}`}
    >
      <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {t(s.labelKey)}
    </span>
  )
}

function PriorityIcon({
  priority,
  t,
}: {
  priority: 'low' | 'normal' | 'high' | 'urgent'
  t: ReturnType<typeof useTranslations>
}) {
  if (priority === 'urgent') {
    return <AlertCircle className="w-3.5 h-3.5 text-brick-600 shrink-0" aria-label={t('priorityUrgent')} />
  }
  if (priority === 'high') {
    return (
      <AlertCircle className="w-3.5 h-3.5 text-[#B5852B] shrink-0" aria-label={t('priorityHigh')} />
    )
  }
  return null
}

function ModalAction({
  children,
  onClick,
  icon,
  accent = 'ink',
}: {
  children: React.ReactNode
  onClick: () => void
  icon: React.ReactNode
  accent?: 'ink' | 'olive' | 'brick'
}) {
  const accentClass =
    accent === 'olive'
      ? 'border-olive-600/40 text-olive-600 hover:bg-olive-600/10'
      : accent === 'brick'
        ? 'border-brick-600/40 text-brick-600 hover:bg-brick-600/10'
        : 'border-sand-300 text-ink-700 hover:bg-sand-100 hover:text-ink-900'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-transparent text-[12.5px] font-medium transition-colors ${accentClass}`}
    >
      {icon}
      {children}
    </button>
  )
}
