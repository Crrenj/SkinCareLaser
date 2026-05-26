'use client'

import Image from 'next/image'
import { User as UserIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

export interface BannerQuoteProps {
  id: string
  eyebrow?: string
  /** Le texte de la citation (sans guillemets — on les ajoute en CSS). */
  title: string
  attribution?: {
    name: string
    title?: string
    photoUrl?: string
  }
}

/**
 * Bannière éditoriale "Quote" — fond ink-900, citation serif italic.
 * Hauteur canonique 220px. Pas de CTA (volontaire — la quote installe, ne vend pas).
 * Avec photo : grid 200 + 1fr. Sans photo : grid-cols-1, citation centrée pleine largeur.
 */
export function BannerQuote({ id, eyebrow, title, attribution }: BannerQuoteProps) {
  const t = useTranslations('Banner')
  const hasPhoto = !!attribution?.photoUrl

  return (
    <div
      data-banner-id={id}
      className={`relative overflow-hidden mb-8 min-h-[220px] bg-ink-900 text-sand-200 rounded grid items-center px-8 md:px-14 py-10 gap-6 ${
        hasPhoto ? 'md:grid-cols-[140px_1fr]' : 'grid-cols-1'
      }`}
    >
      {/* Guillemet décoratif géant en haut-droite */}
      <span
        aria-hidden
        className="absolute -top-10 right-8 font-serif text-[200px] md:text-[280px] leading-none text-clay-700/40 select-none pointer-events-none"
      >
        &ldquo;
      </span>

      {hasPhoto && attribution && (
        <div className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded-full bg-ink-800 border border-ink-700 overflow-hidden flex items-end justify-center mx-auto md:mx-0">
          {attribution.photoUrl && (
            <Image
              src={attribution.photoUrl}
              alt={t('quotePhotoAlt', { name: attribution.name })}
              width={140}
              height={140}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {!hasPhoto && attribution && (
        <span className="sr-only">
          {/* Pas de photo : on garde la photo zone vide visuellement, mais on n'a rien à afficher */}
        </span>
      )}

      <div className="relative z-10">
        {eyebrow && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-400 mb-3">
            {eyebrow}
          </div>
        )}
        <p className="font-serif italic text-[22px] md:text-[28px] leading-snug text-sand-50 mb-4 -tracking-[0.005em] max-w-[720px]">
          &ldquo;{title}&rdquo;
        </p>
        {attribution && (
          <p className="text-[13px] text-ink-500">
            <strong className="text-sand-200 font-semibold">{attribution.name}</strong>
            {attribution.title && <> · {attribution.title}</>}
          </p>
        )}
      </div>
    </div>
  )
}

/** Fallback portrait quand photoUrl est absent mais qu'on veut quand même un avatar. */
export function QuotePlaceholderAvatar() {
  return (
    <div className="w-full h-full flex items-center justify-center text-ink-700">
      <UserIcon size={48} strokeWidth={1.4} />
    </div>
  )
}
