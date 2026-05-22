'use client'

import { useCallback, useRef, useState } from 'react'
import { useModalA11y } from '@/hooks/useModalA11y'

type ConfirmOptions = {
  /** Titre affiché en gras au-dessus du message. Défaut: "Confirmer". */
  title?: string
  /** Texte du bouton de confirmation. Défaut: "Confirmer". */
  confirmLabel?: string
  /** Texte du bouton d'annulation. Défaut: "Annuler". */
  cancelLabel?: string
  /** Style du bouton de confirmation. Défaut: "danger" (red). */
  tone?: 'danger' | 'primary'
}

type PromptState = ConfirmOptions & { message: string } & {
  resolve: (value: boolean) => void
}

/**
 * Remplacement accessible pour `window.confirm`. Renvoie une Promise<boolean>
 * comme l'API native, mais affiche une vraie modale (role=dialog + focus trap
 * + Escape + scroll lock).
 *
 * Usage :
 *   const { confirm, dialog } = useConfirmDialog()
 *   const onDelete = async () => {
 *     if (!(await confirm('Supprimer cet élément ?'))) return
 *     // ... action
 *   }
 *   return <>{dialog}{...rest}</>
 */
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
  tone: 'danger' | 'primary'
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

  const confirmClass =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-blue-600 hover:bg-blue-700'

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
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
        className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-bold text-gray-900 mb-2">
          {title}
        </h3>
        <p id="confirm-dialog-message" className="text-sm text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${confirmClass} ${
              tone === 'danger' ? 'focus-visible:ring-red-500' : 'focus-visible:ring-blue-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
