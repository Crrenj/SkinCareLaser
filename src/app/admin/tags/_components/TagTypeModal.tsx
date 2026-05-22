'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useModalA11y } from '@/hooks/useModalA11y'
import { generateSlug } from '../_lib/icons'
import type { TagType, TypeFormState } from '../_lib/types'
import { IconPicker } from './IconPicker'
import { ColorPicker } from './ColorPicker'

type TagTypeModalProps = {
  open: boolean
  editingType: TagType | null
  form: TypeFormState
  onFormChange: (next: TypeFormState) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function TagTypeModal({
  open,
  editingType,
  form,
  onFormChange,
  onClose,
  onSubmit,
}: TagTypeModalProps) {
  const dialogRef = useModalA11y(open, onClose)
  if (!open) return null

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
        aria-labelledby="tag-type-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="tag-type-modal-title" className="text-lg font-bold text-gray-900">
            {editingType ? 'Modifier le type de tag' : 'Nouveau type de tag'}
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
            <label htmlFor="type-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              id="type-name"
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  name: e.target.value,
                  slug: editingType ? form.slug : generateSlug(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-transparent"
              placeholder="Ex: Texture"
            />
          </div>

          <div>
            <label htmlFor="type-slug" className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              id="type-slug"
              type="text"
              required
              value={form.slug}
              onChange={(e) => onFormChange({ ...form, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-transparent"
              placeholder="Ex: texture"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1">Icône</span>
            <IconPicker
              value={form.icon}
              onChange={(icon) => onFormChange({ ...form, icon })}
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1">Couleur</span>
            <ColorPicker
              value={form.color}
              onChange={(color) => onFormChange({ ...form, color })}
            />
          </div>

          {!editingType && (
            <div>
              <label
                htmlFor="type-initial-tag"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Premier tag (optionnel)
              </label>
              <input
                id="type-initial-tag"
                type="text"
                value={form.initialTag}
                onChange={(e) => onFormChange({ ...form, initialTag: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-transparent"
                placeholder="Ex: Crémeuse"
              />
              <p className="mt-1 text-xs text-gray-500">
                Vous pouvez créer un premier tag pour ce type
              </p>
            </div>
          )}

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
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              {editingType ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
