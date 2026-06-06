'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Plate } from '@/components/ui/Plate'
import { sanitizeBannerTitle, resolveBannerCta } from './bannerHtml'

export interface BannerHeroProps {
  id: string
  eyebrow?: string
  title: string
  description?: string
  imageUrl?: string
  ctaLabel?: string
  ctaHref?: string
  onClick?: (id: string) => void
}

const OVERLAY =
  'linear-gradient(90deg, rgba(31,27,22,0.72) 0%, rgba(31,27,22,0.4) 48%, rgba(31,27,22,0.05) 100%)'

const CTA_CLASS =
  'group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-[2px] bg-sand-50 text-ink-900 text-[12.5px] font-semibold uppercase tracking-[0.06em] hover:bg-white transition-colors'

/**
 * Bannière « Hero » — campagne pleine largeur. Image full-bleed (ou plaque
 * sombre) + overlay directionnel gauche→droite pour la lisibilité. Zéro blob.
 */
export function BannerHero({
  id,
  eyebrow,
  title,
  description,
  imageUrl,
  ctaLabel,
  ctaHref,
  onClick,
}: BannerHeroProps) {
  const cta = ctaHref ? resolveBannerCta(ctaHref) : null
  return (
    <section
      data-banner-id={id}
      className="relative min-h-[clamp(380px,46vw,520px)] border-y border-ink-700 flex items-center overflow-hidden"
    >
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
      ) : (
        <Plate dark mark className="absolute inset-0 border-0" />
      )}

      <div className="absolute inset-0" style={{ background: OVERLAY }} />

      <div className="relative z-10 w-full mx-auto max-w-[1440px] px-[clamp(20px,6vw,104px)]">
        <div className="max-w-[54%] max-md:max-w-[82%] text-sand-50">
          {eyebrow && (
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-clay-200 mb-5">
              {eyebrow}
            </div>
          )}
          <h2
            className="font-serif font-normal text-[clamp(40px,5.4vw,76px)] leading-[0.98] -tracking-[0.025em] text-sand-50 text-balance mb-5 [&_em]:italic [&_em]:text-clay-200"
            dangerouslySetInnerHTML={{ __html: sanitizeBannerTitle(title) }}
          />
          {description && (
            <p className="text-[17px] leading-[1.5] text-sand-50/[0.86] max-w-[44ch] mb-7">
              {description}
            </p>
          )}
          {ctaLabel && cta && (
            cta.external ? (
              <a
                href={cta.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onClick?.(id)}
                className={CTA_CLASS}
              >
                {ctaLabel}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
            ) : (
              <Link href={cta.href} onClick={() => onClick?.(id)} className={CTA_CLASS}>
                {ctaLabel}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            )
          )}
        </div>
      </div>
    </section>
  )
}
