'use client'

import { TagIcon } from '@heroicons/react/24/outline'
import type { Tag, TagType } from '../_lib/types'

type TagSelectorProps = {
  tagTypes: TagType[]
  tags: Tag[]
  selectedIds: string[]
  onToggle: (tagId: string) => void
}

export function TagSelector({ tagTypes, tags, selectedIds, onToggle }: TagSelectorProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
        <TagIcon className="h-5 w-5 mr-2" />
        Tags du produit
      </h4>
      <div className="space-y-4">
        {tagTypes.map((type) => {
          const typeTags = tags.filter((tag) => tag.tag_type_id === type.id)
          if (typeTags.length === 0) return null
          return (
            <div key={type.id} className="border border-gray-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: type.color }}
                />
                {type.name}
              </h5>
              <div className="flex flex-wrap gap-2">
                {typeTags.map((tag) => {
                  const selected = selectedIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onToggle(tag.id)}
                      aria-pressed={selected}
                      className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                        selected
                          ? 'text-white border-transparent'
                          : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                      style={{ backgroundColor: selected ? type.color : undefined }}
                    >
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
