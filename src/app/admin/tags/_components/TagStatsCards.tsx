'use client'

import { useTranslations } from 'next-intl'
import type { TagCategory } from '../_lib/types'

type TagStatsCardsProps = {
  categories: TagCategory[]
}

export function TagStatsCards({ categories }: TagStatsCardsProps) {
  const t = useTranslations('Admin.tags')
  const totalTags = categories.reduce((sum, c) => sum + c.tags.length, 0)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div className="bg-sand-50 border border-sand-300 rounded-xl px-5 py-4">
        <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500 mb-1.5">
          {t('kpiTypes')}
        </div>
        <span className="font-serif text-[32px] leading-none text-clay-700">
          {categories.length}
        </span>
      </div>
      <div className="bg-sand-50 border border-sand-300 rounded-xl px-5 py-4">
        <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500 mb-1.5">
          {t('kpiTags')}
        </div>
        <span className="font-serif text-[32px] leading-none text-olive-600">{totalTags}</span>
      </div>
      {categories.slice(0, 2).map((category) => (
        <div
          key={category.id}
          className="bg-sand-50 border border-sand-300 rounded-xl px-5 py-4"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              aria-hidden
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: category.color }}
            />
            <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500 truncate">
              {category.name}
            </span>
          </div>
          <span className="font-serif text-[32px] leading-none text-ink-900">
            {category.tags.length}
          </span>
        </div>
      ))}
    </div>
  )
}
