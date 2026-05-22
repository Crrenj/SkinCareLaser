'use client'

import Banner from '@/components/Banner'
import type { BannerData } from '../_lib/types'

type BannersPreviewProps = {
  banners: BannerData[]
}

export function BannersPreview({ banners }: BannersPreviewProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Aperçu - Page d&apos;accueil</h2>
      <div className="space-y-6">
        {banners.map((banner) => (
          <Banner
            key={banner.id}
            id={banner.id}
            type={banner.banner_type}
            title={banner.title}
            description={banner.description || undefined}
            imageUrl={banner.image_url || undefined}
            ctaHref={banner.link_url || undefined}
            ctaLabel={banner.link_text || undefined}
          />
        ))}
      </div>
    </div>
  )
}
