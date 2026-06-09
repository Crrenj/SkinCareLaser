export type PromotionTargetType = 'product' | 'brand' | 'range' | 'tag'

export interface PromotionTarget {
  target_type: PromotionTargetType
  target_id: string
  /** Libellé lisible (renvoyé par le GET ; reconstruit côté form picker). */
  label?: string
}

export interface Promotion {
  id: string
  name: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  start_date: string
  end_date: string
  is_active: boolean
  priority: number
  created_at: string
  targets: PromotionTarget[]
}

export interface PromotionFormState {
  name: string
  discount_type: 'percent' | 'fixed'
  /** Saisi en chaîne (input) → converti en number à la soumission. */
  discount_value: string
  /** Valeurs `datetime-local` (YYYY-MM-DDTHH:mm) → converties en ISO à l'envoi. */
  start_date: string
  end_date: string
  is_active: boolean
  targets: PromotionTarget[]
}

export const INITIAL_PROMOTION_FORM: PromotionFormState = {
  name: '',
  discount_type: 'percent',
  discount_value: '',
  start_date: '',
  end_date: '',
  is_active: true,
  targets: [],
}
