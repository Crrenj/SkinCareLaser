'use client'

import Image from 'next/image'
import {
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { SLOT_LABELS, STATUS_LABELS, type BannerData, type BannerSlot } from '../_lib/types'

type BannersListProps = {
  banners: BannerData[]
  loading: boolean
  activeSlot: BannerSlot | 'all'
  onMove: (id: string, direction: 'up' | 'down') => void
  onToggleActive: (id: string) => void
  onEdit: (banner: BannerData) => void
  onDelete: (id: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-sand-200 text-ink-500',
  scheduled: 'bg-clay-100 text-clay-700',
  active: 'bg-olive-100 text-olive-700',
  paused: 'bg-ochre-100 text-ochre-700',
  expired: 'bg-brick-100 text-brick-600',
}

const SLOT_DOT: Record<BannerSlot, string> = {
  hero: 'bg-clay-600',
  banner: 'bg-olive-600',
  card: 'bg-ochre-600',
  modal: 'bg-brick-600',
}

export function BannersList({
  banners,
  loading,
  activeSlot,
  onMove,
  onToggleActive,
  onEdit,
  onDelete,
}: BannersListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-lg bg-sand-200 animate-pulse" />
        ))}
      </div>
    )
  }

  const filtered = activeSlot === 'all' ? banners : banners.filter(b => b.slot === activeSlot)

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl bg-sand-50 border border-sand-200 p-12 text-center">
        <p className="text-ink-500 text-sm">Aucune annonce dans ce slot.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-sand-50 border border-sand-200 divide-y divide-sand-200">
      {filtered.map((banner, index) => (
        <div key={banner.id} className="flex items-center gap-4 px-5 py-4">
          {banner.image_url ? (
            <Image
              src={banner.image_url}
              alt={banner.title}
              width={56}
              height={56}
              className="rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 bg-sand-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <ImageIcon className="h-5 w-5 text-ink-300" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3
                className="font-serif text-base text-ink-900 truncate cursor-pointer hover:underline"
                onClick={() => onEdit(banner)}
              >
                {banner.title}
              </h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[banner.status] ?? STATUS_COLORS.draft}`}>
                {STATUS_LABELS[banner.status] ?? banner.status}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sand-200 px-2 py-0.5 text-xs font-mono text-ink-500">
                <span className={`w-1.5 h-1.5 rounded-full ${SLOT_DOT[banner.slot]}`} />
                {SLOT_LABELS[banner.slot]}
              </span>
            </div>
            <p className="text-sm text-ink-500 mt-0.5 truncate">
              {banner.description || '—'}
              <span className="ml-3 font-mono text-xs">
                {banner.view_count ?? 0} vues · {banner.click_count ?? 0} clics
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="flex flex-col">
              <button
                onClick={() => onMove(banner.id, 'up')}
                disabled={index === 0}
                aria-label="Monter"
                className="p-1 text-ink-500 hover:text-ink-700 disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onMove(banner.id, 'down')}
                disabled={index === filtered.length - 1}
                aria-label="Descendre"
                className="p-1 text-ink-500 hover:text-ink-700 disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={() => onToggleActive(banner.id)}
              aria-label={banner.is_active ? 'Désactiver' : 'Activer'}
              className={`p-1.5 rounded-lg transition-colors ${
                banner.is_active ? 'text-olive-600 hover:bg-olive-50' : 'text-ink-500 hover:bg-sand-200'
              }`}
            >
              {banner.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>

            <button
              onClick={() => onEdit(banner)}
              aria-label="Modifier"
              className="p-1.5 rounded-lg text-ink-500 hover:bg-sand-200 transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>

            <button
              onClick={() => onDelete(banner.id)}
              aria-label="Supprimer"
              className="p-1.5 rounded-lg text-brick-600 hover:bg-brick-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
