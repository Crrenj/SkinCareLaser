'use client'

import type { TagCategory } from '../_lib/types'

type TagStatsCardsProps = {
  categories: TagCategory[]
}

export function TagStatsCards({ categories }: TagStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {categories.map((category) => {
        const Icon = category.icon
        return (
          <div
            key={category.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center">
              <div
                className="flex-shrink-0 p-3 rounded-lg"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <Icon className="h-6 w-6" style={{ color: category.color }} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{category.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{category.tags.length}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
