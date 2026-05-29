'use client'

import { useEffect } from 'react'
import { BannerEditorial } from './banners/BannerEditorial'
import { BannerHero } from './banners/BannerHero'
import { BannerQuote } from './banners/BannerQuote'

/** Trois fonctions éditoriales — pas six "directions d'image". */
export type BannerType = 'editorial' | 'hero' | 'quote'

/** Anciens types DB pré-migration (sprint 2 livrable 4). Mappés via `normalizeType`. */
type LegacyBannerType =
  | 'image_left'
  | 'image_right'
  | 'image_full'
  | 'card_style'
  | 'minimal'
  | 'gradient_overlay'

export interface BannerData {
  id: string
  type: BannerType | LegacyBannerType
  eyebrow?: string
  /** HTML simple : accepte `<em>` pour le pivot italique. */
  title: string
  description?: string
  imageUrl?: string
  ctaLabel?: string
  ctaHref?: string
  ctaVariant?: 'solid' | 'outline'
  direction?: 'left' | 'right'
  attribution?: {
    name: string
    title?: string
    photoUrl?: string
  }
  onView?: (id: string) => void
  onClick?: (id: string) => void
}

/**
 * Dispatcher mince : appelle le bon sous-composant selon `type`.
 * Gère aussi la rétro-compat avec les 6 anciens `banner_type` DB
 * (le temps que la migration `banner_type_enum` passe).
 */
export default function Banner(props: BannerData) {
  // Telemetry : un seul appel à onView par mount.
  useEffect(() => {
    props.onView?.(props.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id])

  const { type: normalizedType, direction: inferredDirection } = normalizeType(props.type)
  const direction = props.direction ?? inferredDirection

  switch (normalizedType) {
    case 'editorial':
      return (
        <BannerEditorial
          id={props.id}
          eyebrow={props.eyebrow}
          title={props.title}
          description={props.description}
          imageUrl={props.imageUrl}
          ctaLabel={props.ctaLabel}
          ctaHref={props.ctaHref}
          ctaVariant={props.ctaVariant}
          direction={direction}
          onClick={props.onClick}
        />
      )
    case 'hero':
      return (
        <BannerHero
          id={props.id}
          eyebrow={props.eyebrow}
          title={props.title}
          description={props.description}
          imageUrl={props.imageUrl}
          ctaLabel={props.ctaLabel}
          ctaHref={props.ctaHref}
          onClick={props.onClick}
        />
      )
    case 'quote':
      // L'admin range la citation dans `description` (champ « Cita ») et garde
      // `title` comme intitulé court → on l'utilise en eyebrow au-dessus de la cita.
      return (
        <BannerQuote
          id={props.id}
          eyebrow={props.eyebrow ?? props.title}
          title={props.description || props.title}
          attribution={props.attribution}
        />
      )
    default:
      return null
  }
}

/**
 * Mappe les 6 anciens `banner_type` vers les 3 nouveaux.
 * Cf. spec §04 (Migration) — table de mapping ancien → nouveau.
 */
function normalizeType(type: BannerType | LegacyBannerType): {
  type: BannerType
  direction?: 'left' | 'right'
} {
  switch (type) {
    case 'editorial':
    case 'hero':
    case 'quote':
      return { type }
    case 'image_left':
      return { type: 'editorial', direction: 'left' }
    case 'image_right':
      return { type: 'editorial', direction: 'right' }
    case 'image_full':
    case 'gradient_overlay':
      return { type: 'hero' }
    case 'card_style':
    case 'minimal':
      return { type: 'editorial', direction: 'left' }
    default:
      return { type: 'editorial', direction: 'left' }
  }
}
