'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { ShippingZone } from '@/lib/shipping'
import type { CartItem } from '@/types/cart'
import { formatPrice } from '@/lib/formatPrice'
import { ReservationDisclaimer } from './ReservationDisclaimer'

type Props = {
  items: CartItem[]
  subtotal: number
  /** Zone choisie (ou undefined avant l'étape 2). */
  shippingZone?: ShippingZone
  shippingCost: number
  /** Mode `withTotal` montre "Total a coordinar" et le disclaimer (étape 3). */
  variant: 'subtotal-only' | 'with-total' | 'review-aside'
  /** Slot pour le bouton final (variant review-aside). */
  ctaSlot?: React.ReactNode
}

export function ReservationSummary({
  items,
  subtotal,
  shippingZone,
  shippingCost,
  variant,
  ctaSlot,
}: Props) {
  const t = useTranslations('Reservation')
  const tCart = useTranslations('Cart')
  const locale = useLocale()
  const fmt = (n: number) => formatPrice(n, { locale })

  const total = subtotal + shippingCost
  const showFullTotal = variant !== 'subtotal-only'
  const isReviewAside = variant === 'review-aside'
  const tShipping = useTranslations('Reservation.shipping.zones')

  const shippingLabel =
    !shippingZone
      ? null
      : shippingZone === 'pickup'
        ? tShipping('pickup.title')
        : tShipping(`${shippingZone}.title`)

  return (
    <aside
      className={
        'bg-sand-50 border border-sand-300 rounded-xl flex flex-col gap-3 self-start ' +
        (isReviewAside
          ? 'p-7 lg:sticky lg:top-8 h-fit'
          : 'p-6 lg:sticky lg:top-8 h-fit')
      }
    >
      <h2 className="font-serif text-[22px] lg:text-[24px] text-ink-900 mb-1">
        {isReviewAside ? t('review.totalHeading') : tCart('summaryHeading')}
      </h2>

      {!isReviewAside && (
        <div className="flex flex-col gap-2.5 mb-1">
          {items.map((item) => {
            if (!item.product) return null
            const p = item.product
            return (
              <div
                key={item.id}
                className="grid grid-cols-[40px_1fr_auto] gap-2.5 text-[12.5px] items-start"
              >
                <div className="w-10 h-10 bg-sand-200 rounded flex items-center justify-center text-[9px] tracking-[0.1em] uppercase text-ink-400 overflow-hidden">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0].url}
                      alt={p.images[0].alt || p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    'Pack'
                  )}
                </div>
                <div className="text-ink-800 leading-[1.35] min-w-0">
                  <span className="line-clamp-2">{p.name}</span>
                  <small className="block text-ink-500 text-[11.5px] mt-0.5">
                    {p.brand && `${p.brand} · `}
                    {item.quantity} × {fmt(p.price)}
                  </small>
                </div>
                <span className="font-serif text-[14.5px] text-ink-900 text-right leading-[1.2]">
                  {fmt(p.price * item.quantity)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className="h-px bg-sand-300" />

      <div className="flex justify-between text-[13.5px] text-ink-800">
        <span>
          {isReviewAside
            ? t('review.subtotalBreakdown', { count: items.length })
            : tCart('subtotal')}
        </span>
        <span>{fmt(subtotal)} DOP</span>
      </div>

      {showFullTotal && shippingZone ? (
        <div className="flex justify-between text-[13.5px] text-ink-800">
          <span>
            {isReviewAside
              ? t('review.shippingBreakdown', { label: shippingLabel ?? '' })
              : `${tCart('shipping')} · ${shippingLabel ?? ''}`}
          </span>
          <span>
            {shippingCost === 0
              ? t('shipping.zones.pickup.free')
              : `${fmt(shippingCost)} DOP`}
          </span>
        </div>
      ) : (
        <div className="flex justify-between text-[12.5px] text-ink-500">
          <span>{tCart('shipping')}</span>
          <em className="not-italic text-ink-700">{tCart('shippingHint')}</em>
        </div>
      )}

      <div className="h-px bg-sand-300" />

      <div className="flex items-baseline justify-between mt-0.5">
        <span className="text-[12px] tracking-[0.06em] uppercase text-ink-700">
          {showFullTotal && shippingZone
            ? t('review.totalToCoordinate')
            : tCart('subtotalCaps')}
        </span>
        <span className="font-serif text-[28px] lg:text-[32px] text-ink-900 leading-none whitespace-nowrap">
          {fmt(showFullTotal && shippingZone ? total : subtotal)}
          <span className="ml-1.5 font-sans text-[12px] lg:text-[13px] text-ink-500 font-medium tracking-[0.04em]">
            DOP
          </span>
        </span>
      </div>

      {isReviewAside && <ReservationDisclaimer className="mt-1" />}

      {ctaSlot}
    </aside>
  )
}
