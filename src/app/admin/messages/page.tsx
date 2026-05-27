'use client'

import { useState } from 'react'
import { Search, Loader2, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { useMessagesData } from './_hooks/useMessagesData'
import { FILTERS, type StatusFilter } from './_lib/types'
import { Kpi, StatusPill, PriorityIcon, statsCountFor } from './_components/MessageHelpers'
import { MessageDetailModal } from './_components/MessageDetailModal'
import type { ContactMessage } from './_lib/types'

export default function MessagesAdminPage() {
  const t = useTranslations('Admin.messages')
  const tCrumbs = useTranslations('Admin.crumbs')
  const tCommon = useTranslations('Admin.common')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [showModal, setShowModal] = useState(false)

  const { messages, stats, loading, markAsRead, changeStatus, deleteMessage, confirmDialog } =
    useMessagesData(statusFilter)

  const filtered = messages.filter(
    (m) =>
      m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.message.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    return deleteMessage(id, t('deleteConfirmTitle'), t('deleteConfirmBody'), t('deleteConfirmLabel'))
  }

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
                  <span className={`font-mono text-[10.5px] ${active ? 'opacity-85' : 'opacity-70'}`}>{count}</span>
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
        ) : filtered.length === 0 ? (
          <div className="bg-sand-50 border border-sand-300 rounded-xl py-14 text-center text-ink-500 text-[13.5px]">
            <Mail className="w-6 h-6 mx-auto mb-3 opacity-50" />
            {t('emptyState')}
          </div>
        ) : (
          <ul className="bg-sand-50 border border-sand-300 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(31,27,22,0.06),0_12px_32px_-8px_rgba(31,27,22,0.08)] divide-y divide-sand-200 list-none m-0 p-0">
            {filtered.map((message) => {
              const isUnread = message.status === 'unread'
              return (
                <li key={message.id} className={isUnread ? 'bg-clay-50/50' : ''}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMessage(message)
                      setShowModal(true)
                      if (isUnread) markAsRead(message.id)
                    }}
                    className="w-full text-left px-5 py-4 hover:bg-sand-100 transition-colors flex items-start gap-3 group"
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${isUnread ? 'bg-clay-700' : 'bg-transparent border border-sand-400'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <PriorityIcon priority={message.priority} t={t} />
                        <span className={`text-[14px] truncate ${isUnread ? 'font-semibold text-ink-900' : 'font-medium text-ink-800'}`}>
                          {message.subject}
                        </span>
                        <StatusPill status={message.status} t={t} />
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-ink-500 mb-1.5 flex-wrap font-mono">
                        <span className="truncate max-w-[260px]">{message.user_email}</span>
                        <span className="text-ink-500">·</span>
                        <span>{new Date(message.created_at).toLocaleDateString('es-DO')}</span>
                      </div>
                      <p className="text-[13px] text-ink-700 line-clamp-2 leading-[1.5]">{message.message}</p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {selectedMessage && (
        <MessageDetailModal
          message={selectedMessage}
          open={showModal}
          onClose={() => setShowModal(false)}
          onChangeStatus={changeStatus}
          onDelete={handleDelete}
        />
      )}

      {confirmDialog}
    </>
  )
}
