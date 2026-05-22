'use client'

import { TrashIcon } from '@heroicons/react/24/outline'
import { useModalA11y } from '@/hooks/useModalA11y'

type ProductDeleteModalProps = {
  productId: string | null
  onCancel: () => void
  onConfirm: (id: string) => void
}

export function ProductDeleteModal({
  productId,
  onCancel,
  onConfirm,
}: ProductDeleteModalProps) {
  const dialogRef = useModalA11y(!!productId, onCancel)
  if (!productId) return null

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
        aria-labelledby="product-delete-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
      >
        <div className="mt-3 text-center">
          <TrashIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3
            id="product-delete-modal-title"
            className="text-lg font-medium text-gray-900 mt-2"
          >
            Confirmer la suppression
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
          </p>
          <div className="flex justify-center space-x-3 mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(productId)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
