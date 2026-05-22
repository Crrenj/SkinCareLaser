'use client'

import { TrashIcon } from '@heroicons/react/24/outline'
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
  const dialogRef = useModalA11y(!!bannerId, onCancel)
  if (!bannerId) return null

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
        aria-labelledby="annonce-delete-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
      >
        <div className="mt-3 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <TrashIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3
            id="annonce-delete-modal-title"
            className="text-lg font-medium text-gray-900 mt-2"
          >
            Supprimer la bannière
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Êtes-vous sûr de vouloir supprimer cette bannière ? Cette action ne peut pas être
            annulée.
          </p>
        </div>
        <div className="flex justify-center space-x-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(bannerId)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
