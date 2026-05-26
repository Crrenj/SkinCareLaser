'use client'

import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { formatPrice } from '@/lib/formatPrice'

type Props = {
  subtotal: number
  itemCount: number
  onReserve: () => void
  reserving?: boolean
  error?: string | null
}

export function CartDrawerSummary({
  subtotal,
  itemCount,
  onReserve,
  reserving = false,
  error = null,
}: Props) {
  const t = useTranslations('Cart')
  const locale = useLocale()
  const fmt = (n: number) => formatPrice(n, { locale })

  return (
    <div className="flex flex-col gap-[10px]">
      {/* Summary card */}
      <div className="bg-sand-100 rounded-xl px-4 py-[14px] flex flex-col gap-2 text-[13px] text-ink-700">
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-ink-500">
            {t('subtotal')} · {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </span>
          <span className="font-mono text-[13px] text-ink-900">{fmt(subtotal)} DOP</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="font-serif text-[22px] text-ink-900">{t('summaryHeading')}</span>
          <span className="font-mono text-[18px] text-ink-900">{fmt(subtotal)} DOP</span>
        </div>
        <div className="text-[11.5px] text-ink-500 font-serif italic border-t border-dashed border-sand-300 pt-2 mt-0.5">
          {t('shippingHint')}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-brick-600/10 border border-brick-600/25 text-brick-600 text-[13px] rounded-lg px-3 py-2"
        >
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={onReserve}
        disabled={reserving}
        className="flex flex-col items-center gap-1 px-5 py-4 font-medium text-sand-50 bg-ink-900 border-0 rounded-xl cursor-pointer w-full transition-all hover:bg-ink-800 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ transitionDuration: '150ms', transitionTimingFunction: 'var(--pop-ease)' }}
      >
        {reserving ? (
          <span className="inline-flex items-center gap-2 text-[14px]">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('reserving')}
          </span>
        ) : (
          <>
            <span className="text-[14px]">{t('reserveButton')}</span>
            <span className="text-[11px] font-normal opacity-70 font-serif italic tracking-[0.01em]">
              {t('reserveSubLabel')}
            </span>
          </>
        )}
      </button>
    </div>
  )
}
