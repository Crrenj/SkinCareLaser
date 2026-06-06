'use client'

import { useTranslations } from 'next-intl'

type BulkActionBarProps = {
  count: number
  /** Statut commun aux lignes sélectionnées, ou `null` si mixte. */
  sharedStatus: 'pending' | 'confirmed' | 'collected' | 'expired' | 'cancelled' | null
  onClear: () => void
  onWhatsappReminder: () => void
  onAdvance: () => void
  onCancel: () => void
}

/**
 * Barre d'actions par lot · apparaît dès qu'au moins une ligne est cochée.
 * Fond ink-900 contrasté. Si la sélection mixe différents statuts, on
 * masque le bouton "Avancer" (incohérent).
 */
export function BulkActionBar({
  count,
  sharedStatus,
  onClear,
  onWhatsappReminder,
  onAdvance,
  onCancel,
}: BulkActionBarProps) {
  const t = useTranslations('Admin.reservations')
  if (count === 0) return null

  const advanceLabel = sharedStatus
    ? sharedStatus === 'pending'
      ? t('bulk.markConfirmed')
      : sharedStatus === 'confirmed'
        ? t('bulk.markCollected')
        : null
    : null

  return (
    <div
      role="toolbar"
      aria-label={t('bulk.toolbarAria')}
      className="bg-ink-900 text-sand-50 px-5 lg:px-8 py-2.5 border-b border-ink-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[13px] sticky top-[136px] z-[3]"
    >
      <div className="flex items-center gap-3.5">
        <b className="font-semibold">{t('bulk.selected', { count })}</b>
        <button
          type="button"
          onClick={onClear}
          className="text-sand-300 hover:text-sand-50 text-[12px] underline underline-offset-[3px] bg-transparent"
        >
          {t('bulk.deselect')}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onWhatsappReminder}
          className="px-3.5 py-1.5 text-[12.5px] font-medium rounded-md bg-[#25D366] hover:bg-[#1ebd5a] text-white inline-flex items-center gap-1.5 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M20.5 3.4C18.3 1.2 15.3 0 12.1 0 5.5 0 .2 5.3.2 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.7 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.4z" />
          </svg>
          {t('bulk.whatsappReminder')}
        </button>
        {advanceLabel && (
          <button
            type="button"
            onClick={onAdvance}
            className="px-3.5 py-1.5 text-[12.5px] rounded-md bg-transparent border border-sand-500 text-sand-50 hover:bg-sand-50/10 transition-colors"
          >
            {advanceLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 text-[12.5px] rounded-md bg-transparent border border-sand-500 text-sand-50 hover:bg-sand-50/10 transition-colors"
        >
          {t('bulk.cancel')}
        </button>
      </div>
    </div>
  )
}
