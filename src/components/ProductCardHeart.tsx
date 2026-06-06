'use client'

import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useWishlist } from '@/hooks/useWishlist'

interface ProductCardHeartProps {
  productId: string
  className?: string
}

/**
 * Bouton heart top-right de l'image ProductCard.
 * - Empêche la propagation (la card est wrappée dans un Link).
 * - Heart rempli si dans la wishlist.
 * - Si user non-auth, redirige vers /login.
 */
export function ProductCardHeart({ productId, className = '' }: ProductCardHeartProps) {
  const t = useTranslations('Product')
  const router = useRouter()
  const { has, toggle } = useWishlist()
  const isFavorite = has(productId)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const result = await toggle(productId)
    if (result.needAuth) {
      router.push('/login?redirectedFrom=/favoris')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t('wishlistAriaLabel')}
      aria-pressed={isFavorite}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-sand-50/90 backdrop-blur-sm text-ink-900 hover:bg-sand-50 hover:text-clay-700 transition-colors shadow-sm ${
        isFavorite ? 'text-clay-700' : ''
      } ${className}`}
    >
      <Heart
        size={18}
        strokeWidth={1.6}
        fill={isFavorite ? 'currentColor' : 'none'}
      />
    </button>
  )
}
