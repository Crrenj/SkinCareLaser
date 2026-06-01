'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

export interface BannerQuoteProps {
  id: string
  eyebrow?: string
  /** Le texte de la citation (sans guillemets — ajoutés inline en clay). */
  title: string
  attribution?: {
    name: string
    title?: string
    photoUrl?: string
  }
}

/**
 * Bannière « Quote » — interstitiel sombre pleine largeur. Citation serif (non
 * italique), guillemets « » clay comme seul accent. Plus de guillemet géant de
 * 280px (cliché). Avec photo : portrait rond à gauche ; sans : citation seule.
 */
export function BannerQuote({ id, eyebrow, title, attribution }: BannerQuoteProps) {
  const t = useTranslations('Banner')
  const hasPhoto = !!attribution?.photoUrl

  return (
    <section data-banner-id={id} className="bg-ink-900 text-sand-50">
      <div
        className={`mx-auto max-w-[1440px] px-[clamp(20px,6vw,104px)] py-[clamp(56px,8vw,112px)] items-center ${
          hasPhoto ? 'grid md:grid-cols-[auto_1fr] gap-[clamp(36px,5vw,72px)]' : ''
        }`}
      >
        {hasPhoto && attribution?.photoUrl && (
          <div className="w-[clamp(120px,14vw,168px)] aspect-square rounded-full overflow-hidden shrink-0 mx-auto md:mx-0">
            <Image
              src={attribution.photoUrl}
              alt={t('quotePhotoAlt', { name: attribution.name })}
              width={168}
              height={168}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div>
          {eyebrow && (
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-clay-400 mb-6">
              {eyebrow}
            </div>
          )}
          <blockquote className="font-serif text-[clamp(28px,3.6vw,46px)] leading-[1.18] -tracking-[0.015em] text-sand-50 max-w-[24ch] text-balance mb-[26px]">
            <span className="text-clay-400 italic">«</span>
            {' '}
            {title}
            {' '}
            <span className="text-clay-400 italic">»</span>
          </blockquote>
          {attribution && (
            <div className="text-[13.5px] text-ink-400 flex items-center gap-3">
              <b className="text-sand-200 font-semibold">{attribution.name}</b>
              {attribution.title && (
                <>
                  <span className="w-[18px] h-px bg-ink-700" />
                  {attribution.title}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
