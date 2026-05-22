'use client'

import { TagIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import type { Brand } from '../_lib/types'

type BrandStatsCardsProps = {
  brands: Brand[]
}

export function BrandStatsCards({ brands }: BrandStatsCardsProps) {
  const totalRanges = brands.reduce((sum, brand) => sum + (brand.ranges?.length || 0), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <TagIcon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total marques</p>
            <p className="text-2xl font-semibold text-gray-900">{brands.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
              <Squares2X2Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total gammes</p>
            <p className="text-2xl font-semibold text-gray-900">{totalRanges}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Marques actives</p>
            <p className="text-2xl font-semibold text-gray-900">{brands.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
