'use client'

import { TrashIcon } from '@heroicons/react/24/outline'
import { useModalA11y } from '@/hooks/useModalA11y'

type DeleteConfirmModalProps = {
  id: string | null
  title: string
  description: string
  /** id stable pour aria-labelledby (sinon collisions si plusieurs modals montés). */
  labelId: string
  onCancel: () => void
  onConfirm: (id: string) => void
}

export function DeleteConfirmModal({
  id,
  title,
  description,
  labelId,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  const dialogRef = useModalA11y(!!id, onCancel)
  if (!id) return null

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={onCancel}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <TrashIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 id={labelId} className="mt-2 text-lg font-medium text-gray-900">
            {title}
          </h3>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
          <div className="mt-4 flex justify-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(id)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
