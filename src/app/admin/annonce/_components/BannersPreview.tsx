'use client'

import { useTranslations } from 'next-intl'
import Banner from '@/components/Banner'
import type { BannerData } from '../_lib/types'

type BannersPreviewProps = {
  banners: BannerData[]
}

/**
 * Aperçu fidèle de la home : rend les VRAIES bannières (mêmes composants que
 * la page d'accueil) sur un canvas sand-50, enchaînées comme sur la home —
 * pas de séparateurs admin. `onView` n'est pas passé → pas de pollution des
 * compteurs de vues.
 */
export function BannersPreview({ banners }: BannersPreviewProps) {
  const t = useTranslations('Admin.annonce')

  return (
    <section className="rounded-xl border border-sand-300 overflow-hidden shadow-[0_1px_3px_rgba(31,27,22,0.06)]">
      <header className="flex items-center gap-2 px-5 py-3 bg-sand-100 border-b border-sand-300">
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sand-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-sand-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-sand-400" />
        </span>
        <span className="ml-2 font-mono text-[11px] tracking-[0.16em] uppercase text-ink-500 font-semibold">
          {t('previewTitle')}
        </span>
      </header>

      {banners.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-ink-500 bg-sand-50">{t('empty')}</p>
      ) : (
        <div className="bg-sand-50">
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
          ))}
        </div>
      )}
    </section>
  )
}
