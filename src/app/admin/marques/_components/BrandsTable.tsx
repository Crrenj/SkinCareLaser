'use client'

import React, { useState } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import type { Brand, Range } from '../_lib/types'

type BrandsTableProps = {
  brands: Brand[]
  loading: boolean
  onEditBrand: (brand: Brand) => void
  onDeleteBrand: (id: string) => void
  onCreateRange: (brandId: string) => void
  onEditRange: (range: Range) => void
  onDeleteRange: (id: string) => void
}

export function BrandsTable({
  brands,
  loading,
  onEditBrand,
  onDeleteBrand,
  onCreateRange,
  onEditRange,
  onDeleteRange,
}: BrandsTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (brandId: string) => {
    const next = new Set(expanded)
    if (next.has(brandId)) next.delete(brandId)
    else next.add(brandId)
    setExpanded(next)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Marque
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Slug
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gammes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {brands.map((brand) => (
            <React.Fragment key={brand.id}>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggle(brand.id)}
                      aria-label={
                        expanded.has(brand.id)
                          ? `Réduire ${brand.name}`
                          : `Développer ${brand.name}`
                      }
                      aria-expanded={expanded.has(brand.id)}
                      className="mr-2 p-1 hover:bg-gray-100 rounded"
                    >
                      {expanded.has(brand.id) ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{brand.slug}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-900">
                      {brand.ranges?.length || 0} gamme(s)
                    </div>
                    <button
                      onClick={() => onCreateRange(brand.id)}
                      className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50"
                      title="Ajouter une gamme"
                      aria-label={`Ajouter une gamme à ${brand.name}`}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEditBrand(brand)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                      title="Modifier la marque"
                      aria-label={`Modifier la marque ${brand.name}`}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteBrand(brand.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                      title="Supprimer la marque"
                      aria-label={`Supprimer la marque ${brand.name}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              {expanded.has(brand.id) &&
                brand.ranges?.map((range) => (
                  <tr key={`range-${range.id}`} className="bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center pl-8">
                        <Squares2X2Icon className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-700">{range.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500 pl-8">{range.slug}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Gamme
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEditRange(range)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                          title="Modifier la gamme"
                          aria-label={`Modifier la gamme ${range.name}`}
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onDeleteRange(range.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                          title="Supprimer la gamme"
                          aria-label={`Supprimer la gamme ${range.name}`}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {brands.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune marque trouvée</p>
        </div>
      )}
    </div>
  )
}
