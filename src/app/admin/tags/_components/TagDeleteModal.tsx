'use client'

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

  const what = target.type === 'type' ? 'ce type de tag' : 'ce tag'

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
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
        className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white"
      >
        <h3 id="tag-delete-modal-title" className="text-lg font-bold text-gray-900 mb-4">
          Confirmer la suppression
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer {what} ? Cette action est irréversible.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
