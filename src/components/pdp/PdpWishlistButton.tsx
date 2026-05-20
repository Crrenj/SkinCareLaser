'use client'

import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useWishlist } from '@/hooks/useWishlist'

interface PdpWishlistButtonProps {
  productId: string
}

/**
 * Bouton favoris carré 52×52, outline ink-900.
 * Heart rempli quand le produit est dans la wishlist.
 * Si user non-auth, redirige vers /login au clic.
 */
export function PdpWishlistButton({ productId }: PdpWishlistButtonProps) {
  const t = useTranslations('Product')
  const router = useRouter()
  const { has, toggle } = useWishlist()
  const isFavorite = has(productId)

  const handleClick = async () => {
    const result = await toggle(productId)
    if (result.needAuth) {
      router.push(`/login?redirectedFrom=/favoris`)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t('wishlistAriaLabel')}
      aria-pressed={isFavorite}
      className={`w-[52px] h-[52px] bg-white border border-ink-900 rounded-sm flex items-center justify-center transition-colors ${
        isFavorite
          ? 'bg-clay-50 text-clay-700'
          : 'text-ink-900 hover:bg-clay-50 hover:text-clay-700'
      }`}
    >
      <Heart
        size={22}
        strokeWidth={1.5}
        fill={isFavorite ? 'currentColor' : 'none'}
      />
    </button>
  )
}
