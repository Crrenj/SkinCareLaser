'use client'

import { useEffect, useState, type RefObject } from 'react'
import { useTranslations } from 'next-intl'

interface PdpStickyBarProps {
  /** Ref vers la zone d'achat principale (utilisée par IntersectionObserver). */
  buyRowRef: RefObject<HTMLElement | null>
  productName: string
  price: number
  oldPrice?: number
  currency: string
  disabled?: boolean
  onAdd: () => void
}

/**
 * Barre sticky en bas d'écran sur mobile (< lg), affichée dès que la zone
 * d'achat principale sort du viewport.
 *
 * Implémentation : IntersectionObserver pour éviter un scroll listener.
 */
export function PdpStickyBar({
  buyRowRef,
  productName,
  price,
  oldPrice,
  currency,
  disabled,
  onAdd,
}: PdpStickyBarProps) {
  const t = useTranslations('Product.reservation')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = buyRowRef.current
    if (!target) return
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -68px 0px' },
    )
    obs.observe(target)
    return () => obs.disconnect()
  }, [buyRowRef])

  return (
    <div
      aria-hidden={!visible}
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-sand-50 border-t border-sand-200 shadow-[0_-8px_24px_-8px_rgba(31,27,22,0.12)] grid grid-cols-[1fr_auto] gap-3 px-3 py-3 transition-transform duration-200 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex flex-col justify-center min-w-0">
        <div className="text-[11px] text-ink-500 truncate">{productName}</div>
        <div className="font-serif text-[22px] text-ink-900 -tracking-[0.01em] leading-none">
          {price.toFixed(0)}
          <span className="font-sans text-[11px] text-ink-500 ml-1">
            {currency.toUpperCase()}
          </span>
          {oldPrice != null && oldPrice > price && (
            <span className="font-sans text-[12px] text-ink-400 line-through ml-2">
              {oldPrice.toFixed(0)}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="px-5 bg-clay-700 text-on-accent rounded-sm font-semibold text-[13px] tracking-[0.02em] hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('ctaShort')}
      </button>
    </div>
  )
}
