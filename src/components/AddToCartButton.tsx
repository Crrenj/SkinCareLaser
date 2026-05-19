'use client'

import { useState } from 'react'
import { ShoppingCart, Check, Loader2, Plus } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

type Variant = 'default' | 'outline' | 'ghost' | 'icon' | 'card-cta'

interface AddToCartButtonProps {
  productId: string
  disabled?: boolean
  className?: string
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
}

export function AddToCartButton({
  productId,
  disabled = false,
  className = '',
  variant = 'default',
  size = 'md'
}: AddToCartButtonProps) {
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Évite la navigation du <Link> parent (ProductCard)
    e.preventDefault()
    e.stopPropagation()

    if (disabled || isAdding) return

    setIsAdding(true)
    setShowSuccess(false)

    try {
      await addToCart(productId, 1)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (error) {
      console.error('Erreur ajout au panier:', error)
    } finally {
      setIsAdding(false)
    }
  }

  // Variantes "card" : rendu sur-mesure, pas de gabarit générique
  if (variant === 'icon') {
    const stateClasses = disabled || isAdding ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || isAdding}
        aria-label="Ajout rapide au panier"
        className={`inline-flex items-center justify-center rounded-full bg-ink-900 text-sand-50 hover:bg-clay-700 transition-colors ${stateClasses} ${className}`}
        data-testid="add-to-cart-button"
      >
        {isAdding ? (
          <Loader2 size={16} className="animate-spin" />
        ) : showSuccess ? (
          <Check size={16} />
        ) : (
          <Plus size={18} />
        )}
      </button>
    )
  }

  if (variant === 'card-cta') {
    const base = disabled
      ? 'border-sand-400 text-ink-500 cursor-not-allowed'
      : 'border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-sand-50'
    const label = disabled ? 'Indisponible' : isAdding ? 'Ajout…' : showSuccess ? 'Ajouté !' : 'Ajouter'
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || isAdding}
        className={`text-[13px] font-medium px-4 py-2 rounded-sm border transition-colors whitespace-nowrap ${base} ${className}`}
        data-testid="add-to-cart-button"
      >
        {label}
      </button>
    )
  }

  // Gabarit générique pour default / outline / ghost
  const baseClasses = {
    default: 'bg-clay-700 text-white hover:bg-clay-800',
    outline: 'border border-clay-700 text-clay-700 hover:bg-clay-50',
    ghost: 'text-clay-700 hover:bg-clay-50',
  } as const

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  } as const

  const stateClasses = disabled || isAdding ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

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
