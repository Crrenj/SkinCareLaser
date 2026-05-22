'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useModalA11y } from '@/hooks/useModalA11y'
import { generateSlug } from '@/lib/slug'
import type { Brand, Product, ProductFormState, Tag, TagType } from '../_lib/types'
import { TagSelector } from './TagSelector'

type ProductFormModalProps = {
  open: boolean
  editingProduct: Product | null
  form: ProductFormState
  onFormChange: (next: ProductFormState) => void
  brands: Brand[]
  tags: Tag[]
  tagTypes: TagType[]
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function ProductFormModal({
  open,
  editingProduct,
  form,
  onFormChange,
  brands,
  tags,
  tagTypes,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const dialogRef = useModalA11y(open, onClose)
  if (!open) return null

  const selectedBrandRanges = brands.find((b) => b.id === form.brand_id)?.ranges || []

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result?.toString().split(',')[1]
      onFormChange({ ...form, imageFile: base64 || null })
    }
    reader.readAsDataURL(file)
  }

  const toggleTag = (tagId: string) => {
    const selectedTags = form.selectedTags.includes(tagId)
      ? form.selectedTags.filter((id) => id !== tagId)
      : [...form.selectedTags, tagId]
    onFormChange({ ...form, selectedTags })
  }

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
        aria-labelledby="product-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 id="product-modal-title" className="text-lg font-bold text-gray-900">
            {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Informations de base</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du produit
                </label>
                <input
                  id="product-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    onFormChange({
                      ...form,
                      name: e.target.value,
                      slug: editingProduct ? form.slug : generateSlug(e.target.value),
                    })
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="product-slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  id="product-slug"
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => onFormChange({ ...form, slug: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="product-description"
                value={form.description}
                onChange={(e) => onFormChange({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 mb-1">
                  Prix (DOP)
                </label>
                <input
                  id="product-price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => onFormChange({ ...form, price: parseFloat(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  id="product-stock"
                  type="number"
                  required
                  min="0"
                  value={form.stock}
                  onChange={(e) => onFormChange({ ...form, stock: parseInt(e.target.value, 10) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="product-image" className="block text-sm font-medium text-gray-700 mb-1">
                  Image (PNG)
                </label>
                <input
                  id="product-image"
                  type="file"
                  accept="image/png"
                  onChange={handleImageChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Marque et gamme */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Marque et gamme</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-brand" className="block text-sm font-medium text-gray-700 mb-1">
                  Marque
                </label>
                <select
                  id="product-brand"
                  value={form.brand_id}
                  onChange={(e) =>
                    onFormChange({ ...form, brand_id: e.target.value, range_id: '' })
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une marque</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="product-range" className="block text-sm font-medium text-gray-700 mb-1">
                  Gamme
                </label>
                <select
                  id="product-range"
                  value={form.range_id}
                  onChange={(e) => onFormChange({ ...form, range_id: e.target.value })}
                  disabled={!form.brand_id}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Sélectionner une gamme</option>
                  {selectedBrandRanges.map((range) => (
                    <option key={range.id} value={range.id}>
                      {range.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <TagSelector
            tagTypes={tagTypes}
            tags={tags}
            selectedIds={form.selectedTags}
            onToggle={toggleTag}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {editingProduct ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
