export type BannerType =
  | 'editorial'
  | 'hero'
  | 'quote'
  | 'image_left'
  | 'image_right'
  | 'image_full'
  | 'card_style'
  | 'minimal'
  | 'gradient_overlay'

export type BannerSlot = 'hero' | 'banner' | 'card' | 'modal'
export type BannerStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired'

export interface BannerData {
  id: string
  title: string
  description: string
  image_url: string
  link_url: string | null
  link_text: string | null
  banner_type: BannerType
  position: number
  is_active: boolean
  slot: BannerSlot
  status: BannerStatus
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  click_count: number
  view_count: number
  direction: 'left' | 'right' | null
  attribution_name: string | null
  attribution_title: string | null
  attribution_photo_url: string | null
}

export interface BannerFormState {
  title: string
  description: string
  image_url: string
  link_url: string
  link_text: string
  banner_type: BannerType
  position: number
  is_active: boolean
  slot: BannerSlot
  status: BannerStatus
  start_date: string
  end_date: string
  direction: 'left' | 'right'
  attribution_name: string
  attribution_title: string
  attribution_photo_url: string
}

export const LEGACY_TO_NEW: Partial<Record<BannerType, BannerType>> = {
  image_left: 'editorial',
  image_right: 'editorial',
  card_style: 'editorial',
  minimal: 'editorial',
  image_full: 'hero',
  gradient_overlay: 'hero',
}

export const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  editorial: 'Editorial',
  hero: 'Hero',
  quote: 'Quote',
  image_left: 'Image gauche',
  image_right: 'Image droite',
  image_full: 'Image pleine',
  card_style: 'Carte',
  minimal: 'Minimal',
  gradient_overlay: 'Gradient',
}

export const SLOT_LABELS: Record<BannerSlot, string> = {
  hero: 'Hero',
  banner: 'Banner',
  card: 'Card',
  modal: 'Modal',
}

export const STATUS_LABELS: Record<BannerStatus, string> = {
  draft: 'Brouillon',
  scheduled: 'Programmé',
  active: 'Actif',
  paused: 'Pausé',
  expired: 'Expiré',
}

export const INITIAL_BANNER_FORM: BannerFormState = {
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  link_text: '',
  banner_type: 'editorial',
  position: 1,
  is_active: true,
  slot: 'banner',
  status: 'draft',
  start_date: '',
  end_date: '',
  direction: 'left',
  attribution_name: '',
  attribution_title: '',
  attribution_photo_url: '',
}
