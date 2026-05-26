'use client'

import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { PICKUP_LOCATION, SHIPPING_COSTS } from '@/lib/shipping'
import { formatPrice } from '@/lib/formatPrice'
import { toLocaleTag } from '@/lib/constants'

export type ConfirmationItem = {
  id: string
  productId: string | null
  name: string
  brand: string | null
  image: string | null
  unitPrice: number
  quantity: number
}

export type ConfirmationAddress = {
  firstName: string
  lastName: string
  street: string
  city: string
  postalCode: string
  phone: string
}

export type ConfirmationShipping =
  | { kind: 'delivery'; zone: 'santo_domingo' | 'interior' }
  | { kind: 'pickup'; pickupId?: string }

type Props = {
  items: ConfirmationItem[]
  subtotal: number
  shipping?: ConfirmationShipping
  address?: ConfirmationAddress
  /** Nom utilisé en fallback quand l'adresse manque (récupéré depuis reservations.contact_name) */
  fallbackName?: string
  /** Téléphone utilisé en fallback (récupéré depuis reservations.contact_phone) */
  fallbackPhone?: string
  note?: string
  savedAt?: string | null
}

export function ConfirmationRecap({
  items,
  subtotal,
  shipping,
  address,
  fallbackName,
  fallbackPhone,
  note,
  savedAt,
}: Props) {
  const t = useTranslations('Reservation.confirmation')
  const tDeliv = useTranslations('Reservation.deliveryLabels')
  const locale = useLocale()
  const fmt = (n: number) => formatPrice(n, { locale })

  const shippingCost =
    !shipping || shipping.kind === 'pickup' ? 0 : SHIPPING_COSTS[shipping.zone]
  const total = subtotal + shippingCost
  const pickup = shipping?.kind === 'pickup' ? PICKUP_LOCATION : undefined

  const shippingTitle = !shipping
    ? null
    : shipping.kind === 'pickup'
      ? tDeliv('pickup')
      : tDeliv(shipping.zone)

  const formattedDate = savedAt
    ? new Intl.DateTimeFormat(toLocaleTag(locale), {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(savedAt))
    : null

  return (
    <article className="bg-sand-50 border border-sand-300 rounded-xl overflow-hidden">
      <header className="px-6 lg:px-8 py-5 lg:py-6 border-b border-sand-300 flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-baseline">
        <h3 className="font-serif text-[22px] lg:text-[26px] m-0 text-ink-900">
          {t('recapTitle')}
        </h3>
        {formattedDate && (
          <small className="text-[12.5px] text-ink-500">
            {t('recapSavedAt', { date: formattedDate })}
          </small>
        )}
      </header>

      {/* Items */}
      <div className="px-6 lg:px-8 pt-4 flex flex-col">
        {items.map((it, idx) => (
          <div
            key={it.id}
            className={`grid grid-cols-[48px_1fr_auto] gap-3.5 items-center py-3 text-[13.5px] ${
              idx < items.length - 1 ? 'border-b border-sand-200' : ''
            }`}
          >
            <div className="relative w-12 h-12 bg-sand-200 rounded flex items-center justify-center text-ink-400 text-[9px] tracking-[0.08em] uppercase overflow-hidden">
              {it.image ? (
                <Image
                  src={it.image}
                  alt={it.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                'Pack'
              )}
            </div>
            <div className="min-w-0">
              <b className="font-medium text-ink-900 block">{it.name}</b>
              <small className="block text-[11px] text-ink-500 mt-0.5">
                {it.brand && `${it.brand} · `}
                {it.quantity} × {fmt(it.unitPrice)} DOP
              </small>
            </div>
            <span className="font-serif text-[16px] text-right text-ink-900 whitespace-nowrap">
              {fmt(it.unitPrice * it.quantity)}
              <small className="font-sans text-[10.5px] text-ink-500 ml-1">DOP</small>
            </span>
          </div>
        ))}
      </div>

      {/* Address + Shipping (only when we have at least one) */}
      {(address || shipping) && (
        <div className="px-6 lg:px-8 py-5 grid grid-cols-1 sm:grid-cols-2 gap-7">
          {address && (
            <div>
              <h4 className="text-[11.5px] tracking-[0.14em] uppercase text-ink-500 font-semibold mb-2.5">
                {t('recapAddressHeading')}
              </h4>
              <div className="text-[14px] leading-[1.6] text-ink-800">
                <strong className="text-ink-900 block mb-1">
                  {address.firstName} {address.lastName}
                </strong>
                {address.street}
                <br />
                {address.city} · {address.postalCode}
                <br />
                <span className="text-clay-700 font-medium mt-1.5 inline-block">
                  <span aria-hidden>📱</span> {address.phone}
                </span>
              </div>
            </div>
          )}
          {!address && (fallbackName || fallbackPhone) && (
            <div>
              <h4 className="text-[11.5px] tracking-[0.14em] uppercase text-ink-500 font-semibold mb-2.5">
                {t('recapAddressHeading')}
              </h4>
              <div className="text-[14px] leading-[1.6] text-ink-800">
                <strong className="text-ink-900 block mb-1">{fallbackName}</strong>
                <span className="text-clay-700 font-medium mt-1.5 inline-block">
                  <span aria-hidden>📱</span> {fallbackPhone}
                </span>
              </div>
            </div>
          )}
          {shipping && (
            <div>
              <h4 className="text-[11.5px] tracking-[0.14em] uppercase text-ink-500 font-semibold mb-2.5">
                {t('recapShippingHeading')}
              </h4>
              <div className="text-[14px] leading-[1.6] text-ink-800">
                <strong className="text-ink-900 block mb-1">{shippingTitle}</strong>
                {tDeliv.rich(
                  shipping.kind === 'pickup' ? 'pickup_subtitle' : `${shipping.zone}_subtitle`,
                  {
                    strong: (chunks) => (
                      <strong className="text-ink-800 font-semibold">{chunks}</strong>
                    ),
                  },
                )}
                {pickup && (
                  <span className="block mt-1 text-[12.5px] text-ink-500">
                    {pickup.name} · {pickup.address}
                  </span>
                )}
                {note && (
                  <span className="block mt-2 text-[12.5px] text-ink-500">
                    <b className="text-ink-700 font-medium">{t('recapNoteLabel')}</b> {note}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Foot totals */}
      <div className="px-6 lg:px-8 py-5 lg:py-6 bg-sand-100 border-t border-sand-300 flex flex-col gap-2">
        <div className="flex justify-between text-[13.5px] text-ink-800">
          <span>{t('recapSubtotalBreakdown', { count: items.length })}</span>
          <span>{fmt(subtotal)} DOP</span>
        </div>
        {shipping && (
          <div className="flex justify-between text-[13.5px] text-ink-800">
            <span>{t('recapShipping')}</span>
            <span>
              {shippingCost === 0 ? '—' : `${fmt(shippingCost)} DOP`}
            </span>
          </div>
        )}
        <div className="flex justify-between items-baseline mt-1.5 pt-2.5 border-t border-sand-300">
          <span className="text-[11.5px] tracking-[0.08em] uppercase text-ink-700">
            {t('recapTotal')}
          </span>
          <span className="font-serif text-[28px] lg:text-[30px] text-ink-900 leading-none whitespace-nowrap">
            {fmt(total)}
            <small className="font-sans text-[11.5px] text-ink-500 font-medium ml-1.5">
              DOP
            </small>
          </span>
        </div>
      </div>
    </article>
  )
}
