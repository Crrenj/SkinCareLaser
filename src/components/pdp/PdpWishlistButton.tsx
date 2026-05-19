'use client'

import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PdpWishlistButtonProps {
  productId: string
  onToggle?: (productId: string) => void
}

/**
 * Bouton favoris carré 52×52, outline ink-900.
 * Pour le sprint 2 c'est un no-op visuel — le système de favoris arrivera plus tard.
 */
export function PdpWishlistButton({ productId, onToggle }: PdpWishlistButtonProps) {
  const t = useTranslations('Product')
  return (
    <button
      type="button"
      onClick={() => onToggle?.(productId)}
      aria-label={t('wishlistAriaLabel')}
      className="w-[52px] h-[52px] bg-white border border-ink-900 rounded-sm flex items-center justify-center text-ink-900 hover:bg-clay-50 hover:text-clay-700 transition-colors"
    >
      <Heart size={22} strokeWidth={1.5} />
    </button>
  )
}
