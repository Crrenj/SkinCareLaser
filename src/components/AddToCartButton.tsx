'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { ShoppingCart, Check, Loader2, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCart } from '@/hooks/useCart'

type Variant = 'default' | 'outline' | 'ghost' | 'icon' | 'card-cta' | 'card-cta-quick'

interface AddToCartButtonProps {
  productId: string
  disabled?: boolean
  className?: string
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  /** Texte override pour le variant `card-cta-quick`. */
  label?: string
}

export function AddToCartButton({
  productId,
  disabled = false,
  className = '',
  variant = 'default',
  size = 'md',
  label,
}: AddToCartButtonProps) {
  const t = useTranslations('AddToCart')
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
      logger.error('Erreur ajout au panier:', error)
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
        aria-label={t('quickAddAriaLabel')}
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

  if (variant === 'card-cta-quick') {
    const quickLabel = disabled
      ? t('unavailable')
      : isAdding
        ? t('adding')
        : showSuccess
          ? t('added')
          : (label ?? t('add'))
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || isAdding}
        className={`bg-ink-900 text-sand-50 border-0 px-4 py-2.5 rounded-[3px] text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors hover:bg-clay-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        data-testid="add-to-cart-button"
      >
        {isAdding ? (
          <Loader2 size={14} className="animate-spin" />
        ) : showSuccess ? (
          <Check size={14} />
        ) : null}
        {quickLabel}
      </button>
    )
  }

  if (variant === 'card-cta') {
    const base = disabled
      ? 'border-sand-400 text-ink-500 cursor-not-allowed'
      : 'border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-sand-50'
    const label = disabled ? t('unavailable') : isAdding ? t('adding') : showSuccess ? t('added') : t('add')
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
          {t('adding')}
        </>
      ) : showSuccess ? (
        <>
          <Check size={16} />
          {t('added')}
        </>
      ) : (
        <>
          <ShoppingCart size={16} />
          {t('addToCart')}
        </>
      )}
    </button>
  )
}
