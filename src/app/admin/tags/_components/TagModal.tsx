'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useModalA11y } from '@/hooks/useModalA11y'
import { generateSlug } from '../_lib/icons'
import type { Tag, TagCategory, TagFormState } from '../_lib/types'

type TagModalProps = {
  open: boolean
  editingTag: Tag | null
  selectedCategoryId: string
  categories: TagCategory[]
  form: TagFormState
  onFormChange: (next: TagFormState) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function TagModal({
  open,
  editingTag,
  selectedCategoryId,
  categories,
  form,
  onFormChange,
  onClose,
  onSubmit,
}: TagModalProps) {
  const dialogRef = useModalA11y(open, onClose)
  if (!open) return null

  const currentCategory = categories.find((c) => c.id === selectedCategoryId)

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tag-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="tag-modal-title" className="text-lg font-bold text-gray-900">
            {editingTag ? 'Modifier le tag' : 'Nouveau tag'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1">Catégorie</span>
            <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 font-medium">
              {currentCategory?.name || 'Catégorie'}
            </div>
          </div>

          <div>
            <label htmlFor="tag-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du tag
            </label>
            <input
              id="tag-name"
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  name: e.target.value,
                  slug: editingTag ? form.slug : generateSlug(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent"
              placeholder="Ex: Hydratant"
            />
          </div>

          <div>
            <label htmlFor="tag-slug" className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              id="tag-slug"
              type="text"
              required
              value={form.slug}
              onChange={(e) => onFormChange({ ...form, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent"
              placeholder="Ex: hydratant"
            />
            <p className="mt-1 text-xs text-gray-500">
              Identifiant unique pour l&apos;URL (lettres minuscules et tirets)
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingTag ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
