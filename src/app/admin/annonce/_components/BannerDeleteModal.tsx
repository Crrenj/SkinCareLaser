'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useModalA11y } from '@/hooks/useModalA11y'

type BannerDeleteModalProps = {
  bannerId: string | null
  onCancel: () => void
  onConfirm: (id: string) => void
}

export function BannerDeleteModal({
  bannerId,
  onCancel,
  onConfirm,
}: BannerDeleteModalProps) {
  const t = useTranslations('Admin.annonce.deleteModal')
  const dialogRef = useModalA11y(!!bannerId, onCancel)
  if (!bannerId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 z-[-1] bg-[--pop-backdrop] backdrop-blur-[14px] backdrop-saturate-[120%]"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="annonce-delete-modal-title"
        tabIndex={-1}
        className="relative mx-auto w-full max-w-[420px] bg-sand-50 flex flex-col overflow-hidden"
        style={{
          borderRadius: 'var(--pop-radius-modal)',
          boxShadow: 'var(--pop-shadow-floating)',
        }}
      >
        <div className="px-[26px] pt-6 pb-4 flex flex-col gap-[14px]">
          <div className="w-11 h-11 rounded-xl inline-flex items-center justify-center bg-brick-50 text-brick-600">
            <AlertTriangle className="w-[22px] h-[22px]" strokeWidth={1.6} />
          </div>
          <h3
            id="annonce-delete-modal-title"
            className="font-serif text-[22px] leading-[1.15] text-ink-900 -tracking-[0.01em] m-0"
          >
            {t('title')}
          </h3>
          <p className="font-serif text-[14.5px] leading-[1.5] text-ink-700 italic m-0">
            {t('body')}
          </p>
        </div>
        <div className="px-[26px] pb-[22px] pt-[14px] flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-[18px] py-[11px] text-[13.5px] font-medium text-ink-700 bg-transparent border border-sand-300 rounded-[10px] hover:bg-sand-100 hover:text-ink-900 transition-colors"
          >
            {t('keep')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(bannerId)}
            className="px-[18px] py-[11px] text-[13.5px] font-medium text-sand-50 bg-brick-600 border-0 rounded-[10px] hover:bg-brick-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick-600 focus-visible:ring-offset-2"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
