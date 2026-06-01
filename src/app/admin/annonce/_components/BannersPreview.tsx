'use client'

import { useTranslations } from 'next-intl'
import Banner from '@/components/Banner'
import type { BannerData } from '../_lib/types'

type BannersPreviewProps = {
  banners: BannerData[]
}

/**
 * Aperçu fidèle : rend les vraies bannières (mêmes composants que la home)
 * dans un cadre éditorial. `onView` n'est pas passé → pas de pollution des
 * compteurs de vues.
 */
export function BannersPreview({ banners }: BannersPreviewProps) {
  const t = useTranslations('Admin.annonce')

  return (
    <section className="rounded-xl bg-sand-50 border border-sand-200 overflow-hidden">
      <header className="flex items-center gap-2 px-5 py-3.5 border-b border-sand-200">
        <span className="w-1.5 h-1.5 rounded-full bg-clay-700" />
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-700 font-semibold">
          {t('previewTitle')}
        </span>
      </header>

      {banners.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-ink-500">{t('empty')}</p>
      ) : (
        <div>
          {banners.map((banner) => (
            <div key={banner.id} className="border-b border-sand-200 last:border-b-0">
              <Banner
                id={banner.id}
                type={banner.banner_type}
                title={banner.title}
                description={banner.description || undefined}
                imageUrl={banner.image_url || undefined}
                ctaHref={banner.link_url || undefined}
                ctaLabel={banner.link_text || undefined}
                direction={banner.direction || undefined}
                attribution={
                  banner.attribution_name
                    ? {
                        name: banner.attribution_name,
                        title: banner.attribution_title || undefined,
                        photoUrl: banner.attribution_photo_url || undefined,
                      }
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
