'use client'

import Image from 'next/image'
import {
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'
import { BANNER_TYPE_LABELS, type BannerData } from '../_lib/types'

type BannersListProps = {
  banners: BannerData[]
  loading: boolean
  onMove: (id: string, direction: 'up' | 'down') => void
  onToggleActive: (id: string) => void
  onEdit: (banner: BannerData) => void
  onDelete: (id: string) => void
}

export function BannersList({
  banners,
  loading,
  onMove,
  onToggleActive,
  onEdit,
  onDelete,
}: BannersListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="text-center py-8">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="divide-y divide-gray-200">
        {banners.map((banner, index) => (
          <div key={banner.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {banner.image_url ? (
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    width={60}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-15 h-15 bg-gray-200 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{banner.title}</h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        banner.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {banner.is_active ? 'Actif' : 'Inactif'}
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {BANNER_TYPE_LABELS[banner.banner_type] ?? 'Autre'}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{banner.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>{banner.view_count} vues</span>
                    <span>{banner.click_count} clics</span>
                    {banner.start_date && (
                      <span>
                        Début: {new Date(banner.start_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {banner.end_date && (
                      <span>Fin: {new Date(banner.end_date).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex flex-col items-center space-y-1">
                  <button
                    onClick={() => onMove(banner.id, 'up')}
                    disabled={index === 0}
                    aria-label={`Monter la bannière ${banner.title}`}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-gray-500">#{banner.position}</span>
                  <button
                    onClick={() => onMove(banner.id, 'down')}
                    disabled={index === banners.length - 1}
                    aria-label={`Descendre la bannière ${banner.title}`}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => onToggleActive(banner.id)}
                  aria-label={
                    banner.is_active
                      ? `Désactiver la bannière ${banner.title}`
                      : `Activer la bannière ${banner.title}`
                  }
                  className={`p-2 rounded-md ${
                    banner.is_active
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {banner.is_active ? (
                    <EyeIcon className="h-5 w-5" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5" />
                  )}
                </button>

                <button
                  onClick={() => onEdit(banner)}
                  aria-label={`Modifier la bannière ${banner.title}`}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>

                <button
                  onClick={() => onDelete(banner.id)}
                  aria-label={`Supprimer la bannière ${banner.title}`}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
