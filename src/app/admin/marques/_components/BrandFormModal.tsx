'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useModalA11y } from '@/hooks/useModalA11y'
import { generateSlug } from '@/lib/slug'
import type { Brand, BrandFormState } from '../_lib/types'

type BrandFormModalProps = {
  open: boolean
  editingBrand: Brand | null
  form: BrandFormState
  onFormChange: (next: BrandFormState) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function BrandFormModal({
  open,
  editingBrand,
  form,
  onFormChange,
  onClose,
  onSubmit,
}: BrandFormModalProps) {
  const dialogRef = useModalA11y(open, onClose)
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="brand-modal-title" className="text-lg font-bold text-gray-900">
            {editingBrand ? 'Modifier la marque' : 'Nouvelle marque'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="brand-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la marque
            </label>
            <input
              id="brand-name"
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  name: e.target.value,
                  slug: editingBrand ? form.slug : generateSlug(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent"
              placeholder="Ex: Avène"
            />
          </div>

          <div>
            <label htmlFor="brand-slug" className="block text-sm font-medium text-gray-700 mb-1">
              Slug (URL)
            </label>
            <input
              id="brand-slug"
              type="text"
              required
              value={form.slug}
              onChange={(e) => onFormChange({ ...form, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent"
              placeholder="Ex: avene"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {editingBrand ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
