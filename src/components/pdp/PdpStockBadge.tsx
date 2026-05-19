'use client'

import { useTranslations } from 'next-intl'

interface PdpStockBadgeProps {
  /** Quantité disponible. Si undefined ou > 0 → "en stock". Si 0 → rupture. */
  stock?: number
}

export function PdpStockBadge({ stock }: PdpStockBadgeProps) {
  const t = useTranslations('Product.stock')
  const outOfStock = stock === 0

  if (outOfStock) {
    return (
      <div className="flex items-center gap-1.5 text-[12.5px] text-brick-600">
        <span aria-hidden className="w-[7px] h-[7px] rounded-full bg-brick-600" />
        {t('outOfStock')}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-[12.5px] text-olive-600">
      <span aria-hidden className="w-[7px] h-[7px] rounded-full bg-olive-600" />
      {t('inStock')}
    </div>
  )
}
