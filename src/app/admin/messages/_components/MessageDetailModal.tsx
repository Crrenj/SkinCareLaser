'use client'

import { Reply, Archive, Trash2, EyeOff, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useModalA11y } from '@/hooks/useModalA11y'
import type { ContactMessage } from '../_lib/types'

interface Props {
  message: ContactMessage
  open: boolean
  onClose: () => void
  onChangeStatus: (id: string, status: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

export function MessageDetailModal({ message, open, onClose, onChangeStatus, onDelete }: Props) {
  const t = useTranslations('Admin.messages')
  const dialogRef = useModalA11y(open, onClose)

  if (!open) return null

  const handleStatus = async (status: string) => {
    const ok = await onChangeStatus(message.id, status)
    if (ok) onClose()
  }

  const handleDelete = async () => {
    const ok = await onDelete(message.id)
    if (ok) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-ink-900/50 overflow-y-auto h-full w-full z-50 flex items-start justify-center px-4 py-12"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="messages-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-sand-50 border border-sand-300 rounded-xl shadow-[0_24px_60px_-12px_rgba(31,27,22,0.35)] overflow-hidden"
      >
        <header className="px-6 py-5 border-b border-sand-300 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 id="messages-modal-title" className="font-serif text-[22px] text-ink-900 leading-tight m-0 mb-2">
              {message.subject}
            </h3>
            <div className="flex items-center gap-2 text-[12px] text-ink-500 font-mono flex-wrap">
              <span className="truncate">{message.user_email}</span>
              <span className="text-ink-500">·</span>
              <span>
                {new Date(message.created_at).toLocaleString('es-DO', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              {message.message}
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => handleStatus('read')} icon={<EyeOff className="w-3.5 h-3.5" />}>
              {t('actionMarkRead')}
            </ActionButton>
            <ActionButton onClick={() => handleStatus('replied')} icon={<Reply className="w-3.5 h-3.5" />} accent="olive">
              {t('actionMarkReplied')}
            </ActionButton>
            <ActionButton onClick={() => handleStatus('archived')} icon={<Archive className="w-3.5 h-3.5" />}>
              {t('actionArchive')}
            </ActionButton>
            <ActionButton onClick={handleDelete} icon={<Trash2 className="w-3.5 h-3.5" />} accent="brick">
              {t('actionDelete')}
            </ActionButton>
          </div>

          <div className="text-[11px] text-ink-500 border-t border-sand-300 pt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono">
            <span>
              <b className="text-ink-700">{t('metaStatus')}</b>{' '}
              {t(`status${message.status.charAt(0).toUpperCase() + message.status.slice(1)}` as
                'statusUnread' | 'statusRead' | 'statusReplied' | 'statusArchived')}
            </span>
            <span>
              <b className="text-ink-700">{t('metaPriority')}</b> {message.priority}
            </span>
            {message.replied_at && (
              <span>
                <b className="text-ink-700">{t('metaRepliedAt')}</b>{' '}
                {new Date(message.replied_at).toLocaleString('es-DO')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  children, onClick, icon, accent = 'ink',
}: {
  children: React.ReactNode; onClick: () => void; icon: React.ReactNode; accent?: 'ink' | 'olive' | 'brick'
}) {
  const cls =
    accent === 'olive' ? 'border-olive-600/40 text-olive-600 hover:bg-olive-600/10'
    : accent === 'brick' ? 'border-brick-600/40 text-brick-600 hover:bg-brick-600/10'
    : 'border-sand-300 text-ink-700 hover:bg-sand-100 hover:text-ink-900'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-transparent text-[12.5px] font-medium transition-colors ${cls}`}
    >
      {icon}{children}
    </button>
  )
}
