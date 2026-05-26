'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { PICKUP_LOCATION, SHIPPING_COSTS, type ShippingZone } from '@/lib/shipping'
import { formatPrice } from '@/lib/formatPrice'
import { ReservationDisclaimer } from './ReservationDisclaimer'

export type ShippingSelection =
  | { zone: 'santo_domingo' | 'interior' }
  | { zone: 'pickup'; pickupId: string }

type Props = {
  initial: ShippingSelection
  onSubmit: (selection: ShippingSelection) => void
  onBack: () => void
}

export function ShippingStep({ initial, onSubmit, onBack }: Props) {
  const t = useTranslations('Reservation.shipping')
  const locale = useLocale()
  const fmt = (n: number) => formatPrice(n, { locale })

  const [zone, setZone] = useState<ShippingZone>(initial.zone)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(zone === 'pickup' ? { zone, pickupId: PICKUP_LOCATION.id } : { zone })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-[28px] lg:text-[36px] leading-[1.1] tracking-[-0.01em] text-ink-900">
          {t('title')}
        </h1>
        <p className="text-[14.5px] text-ink-700 mt-2">{t('lede')}</p>
      </div>

      <div className="flex flex-col gap-3.5">
        <ZoneCard
          zone="santo_domingo"
          title={t('zones.santo_domingo.title')}
          subtitle={t('zones.santo_domingo.subtitle')}
          priceLabel={`${fmt(SHIPPING_COSTS.santo_domingo)}`}
          selected={zone === 'santo_domingo'}
          onSelect={() => setZone('santo_domingo')}
        />
        <ZoneCard
          zone="interior"
          title={t('zones.interior.title')}
          subtitle={t('zones.interior.subtitle')}
          priceLabel={`${fmt(SHIPPING_COSTS.interior)}`}
          selected={zone === 'interior'}
          onSelect={() => setZone('interior')}
        />
        <ZoneCard
          zone="pickup"
          title={t('zones.pickup.title')}
          subtitle={t('zones.pickup.subtitle')}
          priceLabel={t('zones.pickup.free')}
          free
          selected={zone === 'pickup'}
          onSelect={() => setZone('pickup')}
        />

        {zone === 'pickup' && (
          <div className="pl-0 lg:pl-[60px] pt-1">
            <p className="text-[12px] uppercase tracking-[0.1em] text-ink-500 font-medium mb-2.5">
              {t('pickupHeader')}
            </p>
            <div className="grid gap-2">
              <div className="grid grid-cols-[18px_1fr] gap-3 px-3.5 py-3 rounded-lg border border-clay-700 bg-clay-50 shadow-[0_0_0_1px_var(--color-clay-700)_inset] items-start">
                <span className="relative w-3.5 h-3.5 rounded-full border-2 border-clay-700 bg-clay-50 mt-1 after:content-[''] after:absolute after:inset-[2px] after:rounded-full after:bg-clay-700" />
                <div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{PICKUP_LOCATION.name}</div>
                  <div className="text-[12px] text-ink-500 mt-0.5 leading-[1.45]">
                    {PICKUP_LOCATION.address} · {PICKUP_LOCATION.hours} · {PICKUP_LOCATION.phone}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ReservationDisclaimer />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-[13.5px] text-ink-700 border-b border-transparent hover:border-current pb-0.5 self-start sm:self-auto bg-transparent transition-colors"
        >
          {t('backToAddress')}
        </button>
        <button
          type="submit"
          className="h-12 px-7 rounded-lg bg-clay-700 text-sand-50 font-medium text-[14.5px] hover:bg-clay-800 transition-colors inline-flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          {t('continue')}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  )
}

type ZoneCardProps = {
  zone: ShippingZone
  title: string
  subtitle: string
  priceLabel: string
  selected: boolean
  free?: boolean
  onSelect: () => void
}

function ZoneCard({ title, subtitle, priceLabel, selected, free, onSelect }: ZoneCardProps) {
  return (
    <label
      className={`grid grid-cols-[24px_1fr_auto] gap-4 items-center px-5 py-4 rounded-xl border cursor-pointer transition-colors ${
        selected
          ? 'border-clay-700 bg-clay-50 shadow-[0_0_0_1px_var(--color-clay-700)_inset]'
          : 'border-sand-300 bg-sand-50 hover:border-sand-500 hover:bg-sand-100'
      }`}
    >
      <span
        className={`relative w-[18px] h-[18px] rounded-full border-2 ${
          selected
            ? 'border-clay-700 bg-clay-50 after:content-[""] after:absolute after:inset-[3px] after:rounded-full after:bg-clay-700'
            : 'border-sand-500 bg-sand-50'
        }`}
      />
      <input
        type="radio"
        name="zone"
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[15px] font-semibold text-ink-900">{title}</span>
        <span className="text-[13px] text-ink-700 leading-[1.4]">{subtitle}</span>
      </div>
      <span
        className={`font-serif text-[22px] leading-none whitespace-nowrap ${
          free ? 'text-olive-600 italic' : 'text-ink-900'
        }`}
      >
        {priceLabel}
        {!free && (
          <small className="font-sans text-[11px] text-ink-500 font-medium ml-1 tracking-[0.04em]">
            DOP
          </small>
        )}
      </span>
    </label>
  )
}
