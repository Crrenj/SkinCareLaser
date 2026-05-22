export interface Brand {
  id: string
  name: string
  slug: string
  ranges?: Range[]
  created_at?: string
}

export interface Range {
  id: string
  name: string
  slug: string
  brand_id: string
  brands?: Brand
}

export interface BrandFormState {
  name: string
  slug: string
}

export interface RangeFormState {
  name: string
  slug: string
  brand_id: string
}

export const INITIAL_BRAND_FORM: BrandFormState = { name: '', slug: '' }
export const INITIAL_RANGE_FORM: RangeFormState = { name: '', slug: '', brand_id: '' }
