'use client'

import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline'
import type { Tag, TagCategory } from '../_lib/types'

type TagCategoryGridProps = {
  categories: TagCategory[]
  loading: boolean
  onEditType: (categoryId: string) => void
  onDeleteType: (categoryId: string) => void
  onCreateTag: (categoryId: string) => void
  onEditTag: (categoryId: string, tag: Tag) => void
  onDeleteTag: (tagId: string) => void
}

export function TagCategoryGrid({
  categories,
  loading,
  onEditType,
  onDeleteType,
  onCreateTag,
  onEditTag,
  onDeleteTag,
}: TagCategoryGridProps) {
  if (loading) {
    return <div className="text-center py-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const Icon = category.icon
        return (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="h-1" style={{ backgroundColor: category.color }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Icon className="h-7 w-7" style={{ color: category.color }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {category.tags.length} tag{category.tags.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEditType(category.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Modifier le type"
                    aria-label={`Modifier le type ${category.name}`}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDeleteType(category.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer le type"
                    aria-label={`Supprimer le type ${category.name}`}
                    disabled={category.tags.length > 0}
                  >
                    <TrashIcon
                      className={`h-5 w-5 ${category.tags.length > 0 ? 'opacity-50' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => onCreateTag(category.id)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: category.color }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nouveau tag
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {category.tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full mr-3 flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {tag.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTag(category.id, tag)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Modifier le tag"
                        aria-label={`Modifier le tag ${tag.name}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTag(tag.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer le tag"
                        aria-label={`Supprimer le tag ${tag.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {category.tags.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    <TagIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Aucun tag dans cette catégorie</p>
                    <button
                      onClick={() => onCreateTag(category.id)}
                      className="mt-3 text-sm font-medium hover:underline"
                      style={{ color: category.color }}
                    >
                      Ajouter le premier tag
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
