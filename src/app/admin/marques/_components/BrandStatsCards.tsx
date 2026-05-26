'use client'

import type { Brand } from '../_lib/types'

type BrandStatsCardsProps = {
  brands: Brand[]
}

export function BrandStatsCards({ brands }: BrandStatsCardsProps) {
  const totalRanges = brands.reduce((sum, brand) => sum + (brand.ranges?.length || 0), 0)
  const avgRanges = brands.length > 0 ? Math.round((totalRanges / brands.length) * 10) / 10 : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Kpi label="Marcas" value={brands.length} />
      <Kpi label="Gamas" value={totalRanges} accent="olive" />
      <Kpi label="Gamas / marca" value={avgRanges} suffix="prom." />
    </div>
  )
}

function Kpi({
  label,
  value,
  suffix,
  accent = 'clay',
}: {
  label: string
  value: number
  suffix?: string
  accent?: 'clay' | 'olive'
}) {
  const accentClass = accent === 'olive' ? 'text-olive-600' : 'text-clay-700'
  return (
    <div className="bg-sand-50 border border-sand-300 rounded-xl px-5 py-4">
      <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500 mb-1.5">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`font-serif text-[32px] leading-none ${accentClass}`}>{value}</span>
        {suffix && (
          <span className="font-mono text-[11px] text-ink-500 tracking-[0.06em]">{suffix}</span>
        )}
      </div>
    </div>
  )
}
