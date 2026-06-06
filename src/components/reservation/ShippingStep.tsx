'use client'

import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { PICKUP_LOCATION } from '@/lib/shipping'
import { ReservationDisclaimer } from './ReservationDisclaimer'

export type ShippingSelection =
  | { zone: 'santo_domingo' | 'interior' }
  | { zone: 'pickup'; pickupId: string }

type Props = {
  /** Conservé pour compat d'API (ignoré : click & collect = retrait uniquement). */
  initial: ShippingSelection
  onSubmit: (selection: ShippingSelection) => void
  onBack: () => void
}

/**
 * Étape « retrait » du tunnel. FARMAU est click & collect uniquement : il n'y
 * a plus de zones de livraison payantes (les colonnes shipping_* restent en DB,
 * dormantes). On confirme simplement le retrait à l'unique pharmacie.
 */
export function ShippingStep({ onSubmit, onBack }: Props) {
  const t = useTranslations('Reservation.shipping')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ zone: 'pickup', pickupId: PICKUP_LOCATION.id })
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
        {/* Retrait en pharmacie — unique mode (gratuit) */}
        <div className="grid grid-cols-[24px_1fr_auto] gap-4 items-center px-5 py-4 rounded-xl border border-clay-700 bg-clay-50 shadow-[0_0_0_1px_var(--color-clay-700)_inset]">
          <span className="relative w-[18px] h-[18px] rounded-full border-2 border-clay-700 bg-clay-50 after:content-[''] after:absolute after:inset-[3px] after:rounded-full after:bg-clay-700" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[15px] font-semibold text-ink-900">
              {t('zones.pickup.title')}
            </span>
            <span className="text-[13px] text-ink-700 leading-[1.4]">
              {t('zones.pickup.subtitle')}
            </span>
          </div>
          <span className="font-serif text-[22px] leading-none text-olive-600 italic whitespace-nowrap">
            {t('zones.pickup.free')}
          </span>
        </div>

        <div className="pl-0 lg:pl-[60px] pt-1">
          <p className="text-[12px] uppercase tracking-[0.1em] text-ink-500 font-medium mb-2.5">
            {t('pickupHeader')}
          </p>
          <div className="grid gap-2">
            <div className="grid grid-cols-[18px_1fr] gap-3 px-3.5 py-3 rounded-lg border border-clay-700 bg-clay-50 items-start">
              <span className="relative w-3.5 h-3.5 rounded-full border-2 border-clay-700 bg-clay-50 mt-1 after:content-[''] after:absolute after:inset-[2px] after:rounded-full after:bg-clay-700" />
              <div>
                <div className="text-[13.5px] font-semibold text-ink-900">
                  {PICKUP_LOCATION.name}
                </div>
                <div className="text-[12px] text-ink-500 mt-0.5 leading-[1.45]">
                  {PICKUP_LOCATION.address} · {PICKUP_LOCATION.hours} · {PICKUP_LOCATION.phone}
                </div>
              </div>
            </div>
          </div>
        </div>
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
