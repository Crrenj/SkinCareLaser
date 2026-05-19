'use client'

import { useState } from 'react'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { CartItem } from '@/types/cart'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart, isLoading } = useCart()
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    setUpdatingItems(prev => new Set(prev).add(productId))
    
    try {
      await updateQuantity(productId, newQuantity)
    } catch (error) {
      console.error('Erreur mise à jour quantité:', error)
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (productId: string) => {
    setUpdatingItems(prev => new Set(prev).add(productId))
    
    try {
      await removeFromCart(productId)
    } catch (error) {
      console.error('Erreur suppression item:', error)
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DOP'
    }).format(price)
  }

  return (
    <>
      {/* Overlay avec fond semi-transparent */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink-900 bg-opacity-30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`
          fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        data-testid="cart-drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sand-300">
          <div className="flex items-center gap-2">
            <ShoppingBag size={24} className="text-ink-800" />
            <h2 className="text-lg font-semibold text-ink-900">Panier ({totalItems})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-sand-100 rounded-full transition-colors focus:outline-none"
            aria-label="Fermer le panier"
          >
            <X size={20} className="text-ink-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-sand-300 border-t-clay-700 rounded-full animate-spin"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag size={48} className="mx-auto text-ink-200 mb-4" />
                <p className="text-ink-500">Votre panier est vide</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    isUpdating={updatingItems.has(item.product_id)}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-sand-300 p-4 space-y-4 bg-sand-50">
              {/* Total */}
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="text-ink-900">Total</span>
                <span className="text-ink-900">{formatPrice(totalPrice)}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => clearCart()}
                  className="w-full py-2 px-4 text-brick-600 border border-brick-600 rounded-md hover:bg-clay-50 transition-colors focus:outline-none"
                >
                  Vider le panier
                </button>

                <button
                  type="button"
                  disabled
                  title="Checkout pas encore implémenté"
                  className="w-full py-2 px-4 bg-clay-700 text-white rounded-md hover:bg-clay-800 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Procéder au paiement (à venir)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Composant pour un item du panier
interface CartItemCardProps {
  item: CartItem
  isUpdating: boolean
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>
  onRemove: (productId: string) => Promise<void>
  formatPrice: (price: number) => string
}

function CartItemCard({ item, isUpdating, onUpdateQuantity, onRemove, formatPrice }: CartItemCardProps) {
  const [localQuantity, setLocalQuantity] = useState(item.quantity)

  // Vérification de sécurité
  if (!item.product) {
    return null
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return
    setLocalQuantity(newQuantity)
    onUpdateQuantity(item.product_id, newQuantity)
  }

  return (
    <div
      className={`border border-sand-300 rounded-lg p-3 bg-white ${isUpdating ? 'opacity-50' : ''}`}
      data-testid="cart-item"
    >
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-16 h-16 bg-sand-100 rounded-md flex-shrink-0 overflow-hidden">
          {item.product.images[0] && (
            <img
              src={item.product.images[0].url}
              alt={item.product.images[0].alt || item.product.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate text-ink-900">{item.product.name}</h3>
          <p className="text-sm text-ink-700">{formatPrice(item.product.price)}</p>

          {/* Quantity controls */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => handleQuantityChange(localQuantity - 1)}
              disabled={isUpdating || localQuantity <= 1}
              className="p-1 hover:bg-sand-100 rounded disabled:opacity-50 transition-colors focus:outline-none"
              data-testid="quantity-decrease"
            >
              <Minus size={12} className="text-ink-700" />
            </button>

            <span
              className="text-sm font-medium min-w-[2rem] text-center text-ink-900"
              data-testid="quantity-display"
            >
              {localQuantity}
            </span>

            <button
              onClick={() => handleQuantityChange(localQuantity + 1)}
              disabled={isUpdating || localQuantity >= item.product.stock}
              className="p-1 hover:bg-sand-100 rounded disabled:opacity-50 transition-colors focus:outline-none"
              data-testid="quantity-increase"
            >
              <Plus size={12} className="text-ink-700" />
            </button>
          </div>
        </div>

        {/* Remove button */}
        <button
          onClick={() => onRemove(item.product_id)}
          disabled={isUpdating}
          className="p-1 text-brick-600 hover:bg-clay-50 rounded disabled:opacity-50 transition-colors focus:outline-none"
          data-testid="remove-item"
          aria-label={`Supprimer ${item.product.name} du panier`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Subtotal */}
      <div className="mt-2 text-right">
        <span className="text-sm font-medium text-ink-900">
          {formatPrice(item.product.price * localQuantity)}
        </span>
      </div>
    </div>
  )
} 