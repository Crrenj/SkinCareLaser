'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    currency: string
    images: { url: string; alt: string | null }[]
    brand?: string
    range?: string
  }
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: any, quantity: number) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  showPopup: boolean
  popupProduct: any | null
  hidePopup: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const [popupProduct, setPopupProduct] = useState<any | null>(null)

  const addToCart = (product: any, quantity: number) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.product_id === product.id)
      
      if (existingItem) {
        // Si le produit existe déjà, augmenter la quantité
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        // Ajouter un nouveau produit
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`, // ID unique
          product_id: product.id,
          quantity,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            currency: product.currency,
            images: product.images || [],
            brand: product.brand,
            range: product.range
          }
        }
        return [...prev, newItem]
      }
    })

    // Afficher le popup
    setPopupProduct(product)
    setShowPopup(true)
    
    // Masquer le popup après 3 secondes
    setTimeout(() => {
      setShowPopup(false)
      setPopupProduct(null)
    }, 3000)
  }

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      )
    }
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const hidePopup = () => {
    setShowPopup(false)
    setPopupProduct(null)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        showPopup,
        popupProduct,
        hidePopup
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
} 