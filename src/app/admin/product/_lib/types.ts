export interface Brand {
  id: string
  name: string
  ranges: Range[]
}

export interface Range {
  id: string
  name: string
  brand_id: string
}

export interface TagType {
  id: string
  name: string
  slug: string
  icon?: string
  color: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  tag_type_id: string
  tag_type?: TagType
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  currency: string
  stock: number
  /** Calculé serveur-side depuis `product_images[0].url` (la colonne legacy
   * `products.image_url` a été supprimée). */
  image_url: string | null
  is_active: boolean
  brand?: Brand
  product_ranges?: { range_id: string }[]
  product_tags?: { tag: Tag }[]
  tags?: Tag[]
}

export interface ProductFormState {
  name: string
  slug: string
  description: string
  price: number
  stock: number
  brand_id: string
  range_id: string
  imageFile: string | null
  selectedTags: string[]
}

export const INITIAL_PRODUCT_FORM: ProductFormState = {
  name: '',
  slug: '',
  description: '',
  price: 0,
  stock: 0,
  brand_id: '',
  range_id: '',
  imageFile: null,
  selectedTags: [],
}
