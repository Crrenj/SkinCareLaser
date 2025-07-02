import useSWR, { mutate } from 'swr'
import { CartResponse, AddToCartRequest } from '@/types/cart'

// Fetcher pour SWR avec gestion d'erreur améliorée
const fetcher = async (url: string): Promise<CartResponse> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  } catch (error) {
    console.error('Erreur lors de la récupération du panier:', error)
    throw error
  }
}

// Hook principal pour le panier
export function useCart() {
  const { data, error, isLoading, mutate: refreshCart } = useSWR<CartResponse>(
    '/api/cart',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  )

  // Fonction utilitaire pour calculer le prix total
  const calculateTotalPrice = (items: CartResponse['cart']['items']) => {
    return items.reduce((sum, item) => {
      if (!item.product) return sum
      return sum + (item.product.price * item.quantity)
    }, 0)
  }

  // Fonction utilitaire pour calculer le nombre total d'items
  const calculateTotalItems = (items: CartResponse['cart']['items']) => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }

  // Ajouter un produit au panier
  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!data?.cart) return

    // Optimistic update
    const optimisticData: CartResponse = {
      ...data,
      cart: {
        ...data.cart,
        items: [...data.cart.items]
      }
    }

    // Trouver si le produit existe déjà
    const existingItemIndex = optimisticData.cart.items.findIndex(
      item => item.product_id === productId
    )

    if (existingItemIndex >= 0) {
      // Mettre à jour la quantité
      optimisticData.cart.items[existingItemIndex].quantity += quantity
    } else {
      // Ajouter un nouvel item (placeholder)
      optimisticData.cart.items.push({
        id: `temp-${Date.now()}`,
        cart_id: data.cart.id,
        product_id: productId,
        quantity,
        product: {
          id: productId,
          name: 'Chargement...',
          price: 0,
          currency: 'DOP',
          stock: 0,
          images: []
        }
      })
    }

    // Recalculer les totaux
    optimisticData.totalItems = calculateTotalItems(optimisticData.cart.items)
    optimisticData.totalPrice = calculateTotalPrice(optimisticData.cart.items)

    // Appliquer l'update optimiste
    mutate('/api/cart', optimisticData, false)

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity } as AddToCartRequest)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur lors de l'ajout au panier: ${errorText}`)
      }

      // Revalider avec les vraies données
      await refreshCart()
    } catch (error) {
      console.error('Erreur ajout panier:', error)
      // Revenir à l'état précédent en cas d'erreur
      await refreshCart()
      throw error
    }
  }

  // Supprimer un produit du panier
  const removeFromCart = async (productId: string) => {
    if (!data?.cart) return

    // Optimistic update
    const itemToRemove = data.cart.items.find(item => item.product_id === productId)
    if (!itemToRemove) return

    const optimisticData: CartResponse = {
      ...data,
      cart: {
        ...data.cart,
        items: data.cart.items.filter(item => item.product_id !== productId)
      }
    }

    // Recalculer les totaux
    optimisticData.totalItems = calculateTotalItems(optimisticData.cart.items)
    optimisticData.totalPrice = calculateTotalPrice(optimisticData.cart.items)

    // Appliquer l'update optimiste
    mutate('/api/cart', optimisticData, false)

    try {
      const response = await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur lors de la suppression: ${errorText}`)
      }

      // Revalider avec les vraies données
      await refreshCart()
    } catch (error) {
      console.error('Erreur suppression panier:', error)
      // Revenir à l'état précédent en cas d'erreur
      await refreshCart()
      throw error
    }
  }

  // Mettre à jour la quantité d'un produit
  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(productId)
    }

    if (!data?.cart) return

    // Optimistic update
    const itemIndex = data.cart.items.findIndex(item => item.product_id === productId)
    if (itemIndex === -1) return

    const optimisticData: CartResponse = {
      ...data,
      cart: {
        ...data.cart,
        items: [...data.cart.items]
      }
    }

    optimisticData.cart.items[itemIndex].quantity = quantity

    // Recalculer les totaux
    optimisticData.totalItems = calculateTotalItems(optimisticData.cart.items)
    optimisticData.totalPrice = calculateTotalPrice(optimisticData.cart.items)

    // Appliquer l'update optimiste
    mutate('/api/cart', optimisticData, false)

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity } as AddToCartRequest)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur lors de la mise à jour: ${errorText}`)
      }

      // Revalider avec les vraies données
      await refreshCart()
    } catch (error) {
      console.error('Erreur mise à jour panier:', error)
      // Revenir à l'état précédent en cas d'erreur
      await refreshCart()
      throw error
    }
  }

  // Vider le panier
  const clearCart = async () => {
    if (!data?.cart) return

    // Optimistic update
    const optimisticData: CartResponse = {
      ...data,
      cart: {
        ...data.cart,
        items: []
      },
      totalItems: 0,
      totalPrice: 0
    }

    // Appliquer l'update optimiste
    mutate('/api/cart', optimisticData, false)

    try {
      // Supprimer tous les items en parallèle pour de meilleures performances
      const deletePromises = data.cart.items.map(item => 
        fetch(`/api/cart?productId=${encodeURIComponent(item.product_id)}`, {
          method: 'DELETE'
        })
      )
      
      await Promise.all(deletePromises)

      // Revalider avec les vraies données
      await refreshCart()
    } catch (error) {
      console.error('Erreur vidage panier:', error)
      // Revenir à l'état précédent en cas d'erreur
      await refreshCart()
      throw error
    }
  }

  return {
    // Données
    cart: data?.cart || null,
    items: data?.cart?.items || [],
    totalItems: data?.totalItems || 0,
    totalPrice: data?.totalPrice || 0,
    
    // État
    isLoading,
    error,
    
    // Méthodes
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart
  }
} 