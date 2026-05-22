'use client'

import { EyeIcon } from '@heroicons/react/24/outline'
import type { BannerData } from '../_lib/types'

type BannerStatsCardsProps = {
  banners: BannerData[]
}

export function BannerStatsCards({ banners }: BannerStatsCardsProps) {
  const activeCount = banners.filter((b) => b.is_active).length
  const totalViews = banners.reduce((sum, b) => sum + b.view_count, 0)
  const totalClicks = banners.reduce((sum, b) => sum + b.click_count, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card label="Total Bannières" value={banners.length} badge="T" badgeBg="bg-blue-600" />
      <Card
        label="Bannières Actives"
        value={activeCount}
        icon={<EyeIcon className="h-8 w-8 text-green-600" />}
      />
      <Card label="Vues Totales" value={totalViews} badge="V" badgeBg="bg-purple-600" />
      <Card label="Clics Totaux" value={totalClicks} badge="C" badgeBg="bg-orange-600" />
    </div>
  )
}

function Card({
  label,
  value,
  badge,
  badgeBg,
  icon,
}: {
  label: string
  value: number
  badge?: string
  badgeBg?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {icon ?? (
            <div className={`h-8 w-8 ${badgeBg} rounded-full flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">{badge}</span>
            </div>
          )}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
