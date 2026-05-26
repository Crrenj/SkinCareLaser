'use client'

import { AlertTriangle } from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'
import type { DeleteTarget } from '../_lib/types'

type TagDeleteModalProps = {
  target: DeleteTarget | null
  onCancel: () => void
  onConfirm: () => void
}

export function TagDeleteModal({ target, onCancel, onConfirm }: TagDeleteModalProps) {
  const dialogRef = useModalA11y(!!target, onCancel)
  if (!target) return null

  const isType = target.type === 'type'
  const title = isType ? 'Eliminar tipo de etiqueta' : 'Eliminar etiqueta'
  const message = isType
    ? 'Se eliminará este tipo y todas sus etiquetas asociadas. Los productos no serán eliminados.'
    : 'Se eliminará esta etiqueta de todos los productos asociados.'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[--pop-backdrop] backdrop-blur-[14px] backdrop-saturate-[120%]"
      onClick={onCancel}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tag-delete-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
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
            id="tag-delete-modal-title"
            className="font-serif text-[22px] leading-[1.15] text-ink-900 -tracking-[0.01em] m-0"
          >
            {title}
          </h3>
          <p className="font-serif text-[14.5px] leading-[1.5] text-ink-700 italic m-0">
            {message}
          </p>
        </div>
        <div className="px-[26px] pb-[22px] pt-[14px] flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-[18px] py-[11px] text-[13.5px] font-medium text-ink-700 bg-transparent border border-sand-300 rounded-[10px] hover:bg-sand-100 hover:text-ink-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-[18px] py-[11px] text-[13.5px] font-medium text-sand-50 bg-brick-600 border-0 rounded-[10px] hover:bg-brick-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick-600 focus-visible:ring-offset-2"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
