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
  brand?: Brand | null
  /** Mapping côté API : products.range_id direct, ou null. */
  range_id?: string | null
  range?: Range | null
  product_tags?: { tag: Tag }[]
  tags?: Tag[]
}

// `stock` ABSENT du form : le stock se gère exclusivement sur l'écran Stock
// (réception/ajustement/init/perte, avec coût). Le formulaire produit ne le
// touche jamais — cf. productCreate/productUpdate (strip Zod, invariant testé).
export interface ProductFormState {
  name: string
  slug: string
  description: string
  price: number
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
  brand_id: '',
  range_id: '',
  imageFile: null,
  selectedTags: [],
}
