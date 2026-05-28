'use client'

import { Eye, MousePointerClick, BarChart3 } from 'lucide-react'
import { SLOT_LABELS, type BannerData, type BannerSlot } from '../_lib/types'

type BannerStatsCardsProps = {
  banners: BannerData[]
}

const SLOTS: BannerSlot[] = ['hero', 'banner', 'card', 'modal']

export function BannerStatsCards({ banners }: BannerStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {SLOTS.map(slot => {
        const slotBanners = banners.filter(b => b.slot === slot)
        const active = slotBanners.filter(b => b.status === 'active').length
        const views = slotBanners.reduce((s, b) => s + (b.view_count ?? 0), 0)
        const clicks = slotBanners.reduce((s, b) => s + (b.click_count ?? 0), 0)
        const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '—'

        return (
          <article
            key={slot}
            className="rounded-xl bg-sand-50 border border-sand-200 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-ink-900">
                {SLOT_LABELS[slot]}
              </h3>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                active > 0 ? 'bg-olive-100 text-olive-700' : 'bg-sand-200 text-ink-500'
              }`}>
                {active}/{slotBanners.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <Eye className="mx-auto h-4 w-4 text-ink-500 mb-1" />
                <p className="font-mono text-sm text-ink-900">{views.toLocaleString()}</p>
                <p className="text-[10px] text-ink-500 font-mono uppercase">Vues</p>
              </div>
              <div>
                <MousePointerClick className="mx-auto h-4 w-4 text-ink-500 mb-1" />
                <p className="font-mono text-sm text-ink-900">{clicks.toLocaleString()}</p>
                <p className="text-[10px] text-ink-500 font-mono uppercase">Clics</p>
              </div>
              <div>
                <BarChart3 className="mx-auto h-4 w-4 text-ink-500 mb-1" />
                <p className="font-mono text-sm text-ink-900">{ctr}%</p>
                <p className="text-[10px] text-ink-500 font-mono uppercase">CTR</p>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
