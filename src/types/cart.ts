// Types pour le système de panier invité/authentifié

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  quantity: number
  product?: {
    id: string
    name: string
    price: number
    currency: string
    stock: number
    images: Array<{
      url: string
      alt: string
    }>
  }
}

export interface Cart {
  id: string
  user_id: string | null
  anonymous_id: string
  created_at: string
  items: CartItem[]
}

export interface CartResponse {
  cart: Cart
  totalItems: number
  totalPrice: number
}

export interface AddToCartRequest {
  productId: string
  quantity: number
}

export interface UpdateCartRequest {
  productId: string
  quantity: number
}

export interface CartError {
  message: string
  code?: string
}

// Types pour les données brutes de Supabase
export interface CartItemRaw {
  id: string
  cart_id: string
  product_id: string
  quantity: number
  products: {
    id: string
    name: string
    price: number
    currency: string
    stock: number
    product_images: Array<{
      url: string
      alt: string
    }>
  } | null
} 