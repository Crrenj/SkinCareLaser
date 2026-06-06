'use client'

import { useCallback, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'

type ConfirmOptions = {
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'warning' | 'primary'
}

type PromptState = ConfirmOptions & { message: string } & {
  resolve: (value: boolean) => void
}

export function useConfirmDialog() {
  const [prompt, setPrompt] = useState<PromptState | null>(null)
  const pendingRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback(
    (message: string, options: ConfirmOptions = {}): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        pendingRef.current = resolve
        setPrompt({ ...options, message, resolve })
      })
    },
    [],
  )

  const handleResolve = useCallback((value: boolean) => {
    const r = pendingRef.current
    pendingRef.current = null
    setPrompt(null)
    r?.(value)
  }, [])

  const dialog = prompt ? (
    <ConfirmDialogModal
      open
      message={prompt.message}
      title={prompt.title ?? 'Confirmer'}
      confirmLabel={prompt.confirmLabel ?? 'Confirmer'}
      cancelLabel={prompt.cancelLabel ?? 'Annuler'}
      tone={prompt.tone ?? 'danger'}
      onCancel={() => handleResolve(false)}
      onConfirm={() => handleResolve(true)}
    />
  ) : null

  return { confirm, dialog }
}

type ConfirmDialogModalProps = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  tone: 'danger' | 'warning' | 'primary'
  onCancel: () => void
  onConfirm: () => void
}

function ConfirmDialogModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone,
  onCancel,
  onConfirm,
}: ConfirmDialogModalProps) {
  const dialogRef = useModalA11y(open, onCancel)
  if (!open) return null

  const confirmBg =
    tone === 'danger'
      ? 'bg-brick-600 text-sand-50 hover:bg-brick-800 focus-visible:ring-brick-600'
      : tone === 'warning'
        ? 'bg-ochre-600 text-sand-50 hover:bg-ochre-600/90 focus-visible:ring-ochre-600'
        : 'bg-clay-700 text-on-accent hover:bg-accent-hover focus-visible:ring-clay-700'

  const iconBg =
    tone === 'danger'
      ? 'bg-brick-50 text-brick-600'
      : tone === 'warning'
        ? 'bg-ochre-200 text-ochre-600'
        : 'bg-clay-50 text-clay-700'

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
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative mx-auto w-full max-w-[420px] bg-sand-50 overflow-hidden flex flex-col"
        style={{
          borderRadius: 'var(--pop-radius-modal)',
          boxShadow: 'var(--pop-shadow-floating)',
        }}
      >
        <div className="px-[26px] pt-6 pb-4 flex flex-col gap-[14px]">
          {/* Warning icon */}
          <div className={`w-11 h-11 rounded-xl inline-flex items-center justify-center ${iconBg}`}>
            <AlertTriangle className="w-[22px] h-[22px]" strokeWidth={1.6} />
          </div>

          <h3
            id="confirm-dialog-title"
            className="font-serif text-[22px] leading-[1.15] text-ink-900 -tracking-[0.01em] m-0"
          >
            {title}
          </h3>

          <p
            id="confirm-dialog-message"
            className="font-serif text-[14.5px] leading-[1.5] text-ink-700 italic m-0"
          >
            {message}
          </p>
        </div>

        <div className="px-[26px] pb-[22px] pt-[14px] flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-[18px] py-[11px] text-[13.5px] font-medium text-ink-700 bg-transparent border border-sand-300 rounded-[10px] cursor-pointer hover:bg-sand-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-500 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-[18px] py-[11px] text-[13.5px] font-medium border-0 rounded-[10px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors ${confirmBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
