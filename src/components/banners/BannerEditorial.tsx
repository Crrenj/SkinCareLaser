'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Plate } from '@/components/ui/Plate'
import { sanitizeBannerTitle, resolveBannerCta } from './bannerHtml'

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
 * Bannière « Editorial » — split généreux dans la mesure de contenu. Image
 * cadrée 5:4 d'un côté, texte de l'autre (`direction` décide). Plus de carte
 * blanche ombrée : on s'aligne sur le rythme éditorial de la home.
 */
export function BannerEditorial({
  id,
  eyebrow,
  title,
  description,
  imageUrl,
  ctaLabel,
  ctaHref,
  ctaVariant = 'outline',
  direction = 'left',
  onClick,
}: BannerEditorialProps) {
  const imageRight = direction === 'right'
  const cta = ctaHref ? resolveBannerCta(ctaHref) : null
  const ctaClass = `group inline-flex items-center gap-2.5 self-start px-5 py-3 rounded-[2px] text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors ${
    ctaVariant === 'solid'
      ? 'bg-clay-700 text-on-accent hover:bg-clay-800'
      : 'border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-sand-50'
  }`

  return (
    <section className="bg-sand-50">
      <div className="mx-auto max-w-[1440px] px-[clamp(20px,6vw,104px)]">
        <div className="grid md:grid-cols-2 gap-[clamp(28px,4vw,64px)] items-center py-[clamp(36px,5vw,72px)]">
          {/* Art */}
          <div className={imageRight ? 'md:order-2' : 'md:order-1'}>
            {imageUrl ? (
              <div className="relative aspect-[5/4] rounded-[3px] overflow-hidden bg-sand-100 border border-sand-300">
                <Image
                  src={imageUrl}
                  alt={stripHtml(title)}
                  fill
                  sizes="(max-width:768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <Plate mark className="aspect-[5/4] rounded-[3px]" />
            )}
          </div>

          {/* Copy */}
          <div className={imageRight ? 'md:order-1' : 'md:order-2'}>
            {eyebrow && (
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-clay-700 font-medium mb-[18px]">
                {eyebrow}
              </div>
            )}
            <h2
              className="font-serif font-normal text-[clamp(32px,3.8vw,50px)] leading-[1.02] -tracking-[0.02em] text-ink-900 max-w-[14ch] text-balance mb-[18px] [&_em]:italic [&_em]:text-clay-700"
              dangerouslySetInnerHTML={{ __html: sanitizeBannerTitle(title) }}
            />
            {description && (
              <p className="text-[15.5px] leading-[1.6] text-ink-700 max-w-[42ch] mb-7">
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
                  className={ctaClass}
                >
                  {ctaLabel}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              ) : (
                <Link href={cta.href} onClick={() => onClick?.(id)} className={ctaClass}>
                  {ctaLabel}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Strip HTML tags pour les alt text (le titre peut contenir `<em>`). */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}
