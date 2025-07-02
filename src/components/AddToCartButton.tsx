'use client'

import { useState } from 'react'
import { ShoppingCart, Check, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

interface AddToCartButtonProps {
  productId: string
  productName: string
  disabled?: boolean
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function AddToCartButton({
  productId,
  productName,
  disabled = false,
  className = '',
  variant = 'default',
  size = 'md'
}: AddToCartButtonProps) {
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAddToCart = async () => {
    if (disabled || isAdding) return

    setIsAdding(true)
    setShowSuccess(false)

    try {
      await addToCart(productId, 1)
      setShowSuccess(true)
      
      // Masquer le message de succès après 2 secondes
      setTimeout(() => {
        setShowSuccess(false)
      }, 2000)
    } catch (error) {
      console.error('Erreur ajout au panier:', error)
      // Ici on pourrait afficher une notification d'erreur
    } finally {
      setIsAdding(false)
    }
  }

  // Classes de base selon la variante
  const baseClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-blue-600 hover:bg-blue-50'
  }

  // Classes de taille
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  // Classes d'état
  const stateClasses = disabled || isAdding 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer'

  const buttonClasses = `
    inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all
    ${baseClasses[variant]}
    ${sizeClasses[size]}
    ${stateClasses}
    ${className}
  `

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isAdding}
      className={buttonClasses}
      data-testid="add-to-cart-button"
    >
      {isAdding ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Ajout...
        </>
      ) : showSuccess ? (
        <>
          <Check size={16} />
          Ajouté !
        </>
      ) : (
        <>
          <ShoppingCart size={16} />
          Ajouter au panier
        </>
      )}
    </button>
  )
} 