'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export interface BannerEditorialProps {
  id: string
  eyebrow?: string
  /** HTML simple : accepte `<em>` pour le pivot italique clay-700. */
  title: string
  description?: string
  imageUrl?: string
  ctaLabel?: string
  ctaHref?: string
  ctaVariant?: 'solid' | 'outline'
  direction?: 'left' | 'right'
  onClick?: (id: string) => void
}

/**
 * Bannière éditoriale 2 colonnes — image + texte.
 * Hauteur canonique 320px. Direction `left` (image gauche) ou `right` (mirror).
 * Sur mobile, image dessus / texte dessous, hauteur auto.
 */
export function BannerEditorial({
  id,
  eyebrow,
  title,
  description,
  imageUrl,
  ctaLabel,
  ctaHref,
  ctaVariant = 'solid',
  direction = 'left',
  onClick,
}: BannerEditorialProps) {
  const isReversed = direction === 'right'

  return (
    <div className="grid md:grid-cols-2 min-h-[320px] bg-white rounded overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] mb-8">
      <div
        className={`bg-sand-100 flex items-center justify-center p-8 ${
          isReversed ? 'md:order-2' : ''
        }`}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={stripHtml(title)}
            width={400}
            height={400}
            className="w-full max-h-[260px] object-contain"
          />
        )}
      </div>
      <div className="flex flex-col justify-center p-8 md:p-12">
        {eyebrow && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-700 mb-3.5">
            {eyebrow}
          </div>
        )}
        <h2
          className="font-serif text-[32px] md:text-[38px] leading-[1.05] -tracking-[0.02em] text-ink-900 mb-3.5 max-w-[320px] text-balance [&_em]:not-italic [&_em]:font-serif [&_em]:italic [&_em]:text-clay-700"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {description && (
          <p className="text-[15px] leading-[1.55] text-ink-700 mb-6 max-w-[360px]">
            {description}
          </p>
        )}
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            onClick={() => onClick?.(id)}
            className={`group inline-flex items-center gap-2.5 self-start text-[13px] font-semibold uppercase tracking-wider px-5 py-3 rounded-sm transition-colors ${
              ctaVariant === 'solid'
                ? 'bg-clay-700 text-sand-50 hover:bg-clay-800'
                : 'border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-sand-50'
            }`}
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

/** Strip HTML tags pour les alt text (le titre peut contenir `<em>`). */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}
