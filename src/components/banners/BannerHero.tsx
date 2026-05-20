'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'

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

/**
 * Hero plein-bleed avec overlay dégradé sombre et texte gauche.
 * Hauteur canonique 480px (560 sur md+). Image en object-cover.
 * Si pas d'imageUrl, fallback gradient sand → clay → ink + formes botaniques SVG.
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
  return (
    <div className="relative min-h-[480px] md:min-h-[560px] rounded overflow-hidden flex items-center mb-8 bg-gradient-to-br from-[#C7B299] via-[#8E6D4F] to-[#4A3A2C]">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <BotanicalDeco />
      )}

      {/* Overlay : noir gauche → transparent droite pour la lisibilité du texte */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-900/55 via-ink-900/35 to-transparent" />

      <div className="relative z-10 px-8 md:px-16 py-12 md:py-16 max-w-[60%] text-white">
        {eyebrow && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-200 mb-4">
            {eyebrow}
          </div>
        )}
        <h2
          className="font-serif text-[44px] md:text-[64px] leading-none -tracking-[0.025em] text-white mb-4 text-balance [&_em]:not-italic [&_em]:font-serif [&_em]:italic [&_em]:text-clay-200"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {description && (
          <p className="font-serif italic text-[17px] md:text-[19px] leading-[1.4] text-sand-50/90 mb-7 max-w-[520px]">
            {description}
          </p>
        )}
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            onClick={() => onClick?.(id)}
            className="group inline-flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-wider px-6 py-3.5 rounded-sm bg-sand-50 text-ink-900 hover:bg-white transition-colors"
          >
            {ctaLabel}
            <ArrowRight
              size={16}
              strokeWidth={1.8}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        )}
      </div>
    </div>
  )
}

/** Décorations botaniques SVG quand pas d'image (fallback éditorial). */
function BotanicalDeco() {
  return (
    <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-60 pointer-events-none">
      <svg viewBox="0 0 600 600" className="w-full h-full">
        <defs>
          <radialGradient id="leaf-grad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#F4EFE7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8E6D4F" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="300" cy="300" rx="240" ry="180" fill="url(#leaf-grad)" />
        <path
          d="M 380 200 Q 420 280 380 360 Q 320 380 280 320 Q 240 240 280 180 Q 340 160 380 200 Z"
          fill="#CCC5BD"
          opacity="0.4"
        />
        <path
          d="M 200 380 Q 240 460 200 540 Q 140 560 100 500 Q 60 420 100 360 Q 160 340 200 380 Z"
          fill="#D89A75"
          opacity="0.3"
        />
        <circle cx="450" cy="450" r="80" fill="#F0D7C5" opacity="0.4" />
        <circle cx="150" cy="200" r="50" fill="#CCC5BD" opacity="0.3" />
      </svg>
    </div>
  )
}
