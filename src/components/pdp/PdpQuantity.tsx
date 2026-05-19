'use client'

import { useTranslations } from 'next-intl'

interface PdpQuantityProps {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
}

export function PdpQuantity({ value, onChange, min = 1, max = 99 }: PdpQuantityProps) {
  const t = useTranslations('Product.quantity')
  const decrement = () => value > min && onChange(value - 1)
  const increment = () => value < max && onChange(value + 1)

  return (
    <div className="flex items-center justify-between h-[52px] border border-ink-900 rounded-sm bg-white px-2">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label={t('decreaseAriaLabel')}
        className="w-[30px] h-[30px] flex items-center justify-center text-ink-900 disabled:text-ink-400 disabled:cursor-not-allowed rounded-sm hover:bg-sand-100 transition-colors text-lg"
      >
        −
      </button>
      <span className="font-serif text-[22px] text-ink-900 tabular-nums">{value}</span>
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        aria-label={t('increaseAriaLabel')}
        className="w-[30px] h-[30px] flex items-center justify-center text-ink-900 disabled:text-ink-400 disabled:cursor-not-allowed rounded-sm hover:bg-sand-100 transition-colors text-lg"
      >
        +
      </button>
    </div>
  )
}
