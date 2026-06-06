'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import type { CartItem } from '@/types/cart'
import { PICKUP_LOCATION, SHIPPING_COSTS } from '@/lib/shipping'
import { formatPrice } from '@/lib/formatPrice'
import type { AddressData } from './AddressStep'
import type { ShippingSelection } from './ShippingStep'

type Props = {
  items: CartItem[]
  address: AddressData
  shipping: ShippingSelection
  initialNote: string
  onEditAddress: () => void
  onEditShipping: () => void
  onSubmit: (note: string) => void
  submitting?: boolean
  error?: string | null
  /** Permet à l'aside (desktop) de déclencher le submit du form. */
  formRef?: React.RefObject<HTMLFormElement | null>
}

export function ReviewStep({
  items,
  address,
  shipping,
  initialNote,
  onEditAddress,
  onEditShipping,
  onSubmit,
  submitting = false,
  error = null,
  formRef,
}: Props) {
  const t = useTranslations('Reservation.review')
  const tDeliv = useTranslations('Reservation.deliveryLabels')
  const tShipping = useTranslations('Reservation.shipping')
  const tIndic = useTranslations('Reservation.stepIndicator')
  const locale = useLocale()
  const fmt = (n: number) => formatPrice(n, { locale })

  const [note, setNote] = useState(initialNote)

  const shippingCost = SHIPPING_COSTS[shipping.zone]
  const pickup = shipping.zone === 'pickup' ? PICKUP_LOCATION : null

  const shippingTitle =
    shipping.zone === 'pickup' ? tDeliv('pickup') : tDeliv(shipping.zone)
  const shippingSubtitle =
    shipping.zone === 'pickup'
      ? tDeliv('pickup_subtitle')
      : tDeliv(`${shipping.zone}_subtitle`)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(note.trim())
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-[28px] lg:text-[36px] leading-[1.1] tracking-[-0.01em] text-ink-900">
          {t('title')}
        </h1>
        <p className="text-[14.5px] text-ink-700 mt-2">{t('lede')}</p>
      </div>

      {/* Articles */}
      <section>
        <h2 className="font-serif text-[20px] mb-3.5 text-ink-900">
          {t('itemsHeading', { count: items.length })}
        </h2>
        <div className="bg-sand-50 border border-sand-300 rounded-xl overflow-hidden">
          {items.map((item, idx) => {
            if (!item.product) return null
            const p = item.product
            return (
              <div
                key={item.id}
                className={`grid grid-cols-[56px_1fr_auto] gap-3.5 items-center px-4 py-3.5 ${
                  idx < items.length - 1 ? 'border-b border-sand-200' : ''
                }`}
              >
                <div className="w-14 h-14 bg-sand-200 rounded-md flex items-center justify-center text-ink-500 text-[9px] tracking-[0.1em] uppercase overflow-hidden">
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
                <div>
                  {p.brand && (
                    <span className="text-[10.5px] tracking-[0.16em] uppercase text-clay-700 font-semibold block">
                      {p.brand}
                    </span>
                  )}
                  <span className="text-[14px] font-medium block">{p.name}</span>
                  <span className="text-[12px] text-ink-500 mt-0.5 block">
                    {item.quantity} × {fmt(p.price)} DOP
                  </span>
                </div>
                <span className="font-serif text-[18px] whitespace-nowrap text-right">
                  {fmt(p.price * item.quantity)}
                  <small className="ml-1 font-sans text-[11px] text-ink-500">DOP</small>
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Adresse */}
      <section>
        <div className="flex items-baseline justify-between mb-3.5">
          <h2 className="font-serif text-[20px] m-0 text-ink-900">{t('addressHeading')}</h2>
          <button
            type="button"
            onClick={onEditAddress}
            className="text-[12.5px] text-ink-700 underline underline-offset-4 hover:text-ink-900 bg-transparent transition-colors"
          >
            {tIndic('edit')}
          </button>
        </div>
        <div className="bg-sand-50 border border-sand-300 rounded-xl p-5 text-[14px] leading-[1.55]">
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
      </section>

      {/* Livraison */}
      <section>
        <div className="flex items-baseline justify-between mb-3.5">
          <h2 className="font-serif text-[20px] m-0 text-ink-900">{t('shippingHeading')}</h2>
          <button
            type="button"
            onClick={onEditShipping}
            className="text-[12.5px] text-ink-700 underline underline-offset-4 hover:text-ink-900 bg-transparent transition-colors"
          >
            {tIndic('edit')}
          </button>
        </div>
        <div className="bg-sand-50 border border-sand-300 rounded-xl p-5 text-[14px] leading-[1.55] flex justify-between items-start gap-4">
          <div>
            <strong className="text-ink-900 block mb-1">{shippingTitle}</strong>
            <span className="text-ink-700">
              {tDeliv.rich(
                shipping.zone === 'pickup' ? 'pickup_subtitle' : `${shipping.zone}_subtitle`,
                {
                  strong: (chunks) => (
                    <strong className="text-ink-800 font-semibold">{chunks}</strong>
                  ),
                },
              )}
            </span>
            {pickup && (
              <div className="text-[12.5px] text-ink-500 mt-2 leading-[1.5]">
                {pickup.name} · {pickup.address}
              </div>
            )}
            {!pickup && shippingSubtitle && null /* already rendered via t.rich */}
          </div>
          <span className="font-serif text-[18px] whitespace-nowrap">
            {shipping.zone === 'pickup' ? (
              <span className="text-olive-600 italic">{tShipping('zones.pickup.free')}</span>
            ) : (
              <>
                {fmt(shippingCost)}
                <small className="ml-1 font-sans text-[11px] text-ink-500">DOP</small>
              </>
            )}
          </span>
        </div>
      </section>

      {/* Note */}
      <section>
        <h2 className="font-serif text-[20px] m-0 text-ink-900 mb-1.5">
          {t('noteHeading')}{' '}
          <span className="font-sans text-[12px] text-ink-500 font-normal">
            {t('noteOptional')}
          </span>
        </h2>
        <p className="text-[13px] text-ink-700 mb-2.5">{t('noteLede')}</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('notePlaceholder')}
          maxLength={500}
          className="w-full min-h-[80px] px-3 py-3 rounded-lg border border-sand-300 bg-sand-50 text-[14px] text-ink-900 leading-[1.5] placeholder:text-ink-500 focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-[3px] focus-visible:ring-clay-700/20 transition-colors resize-y"
        />
      </section>

      {error && (
        <p
          role="alert"
          className="text-[13px] text-brick-600 bg-brick-600/10 border border-brick-600/25 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      {/* Mobile submit (l'aside contient le CTA principal sur desktop) */}
      <div className="lg:hidden flex flex-col gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="h-14 rounded-xl bg-clay-700 hover:bg-clay-800 text-on-accent font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center leading-tight gap-0.5"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2 text-[14.5px]">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('submitting')}
            </span>
          ) : (
            <>
              <span className="text-[14.5px]">{t('cta')}</span>
              <span className="text-[10.5px] font-normal opacity-85 tracking-[0.06em]">
                {t('ctaSubLabel')}
              </span>
            </>
          )}
        </button>
        <p className="text-[11px] text-ink-500 text-center leading-[1.5]">{t('consent')}</p>
        <button
          type="button"
          onClick={onEditShipping}
          className="text-[13px] text-ink-700 text-center bg-transparent transition-colors"
        >
          {t('backToShipping')}
        </button>
      </div>

      {/* Slot pour la CTA desktop dans l'aside parent : on émet un événement
          via window pour qu'une autre partie du parent puisse soumettre.
          Plus simple : le parent (ReservationClient) rend lui-même un bouton
          dans l'aside qui appelle requestSubmit() sur ce <form>. */}
    </form>
  )
}
