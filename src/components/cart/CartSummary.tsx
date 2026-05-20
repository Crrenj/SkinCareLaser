'use client'

import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

type CartSummaryProps = {
  /** Sous-total panier (sans livraison — la livraison est calculée à l'étape suivante) */
  subtotal: number
  /** Variante : page sticky (border + padding généreux) ou drawer (footer compact). */
  variant: 'page' | 'drawer'
  /** Click sur "Réserver". */
  onReserve: () => void
  reserving?: boolean
  error?: string | null
  /** Cache les "trust signals" (utile sur le drawer / mobile compact). */
  hideTrustSignals?: boolean
}

const localeMap: Record<string, string> = { fr: 'fr-FR', es: 'es-DO', en: 'en-US' }

export function CartSummary({
  subtotal,
  variant,
  onReserve,
  reserving = false,
  error = null,
  hideTrustSignals = false,
}: CartSummaryProps) {
  const t = useTranslations('Cart')
  const locale = useLocale()
  const fmt = (n: number) =>
    new Intl.NumberFormat(localeMap[locale] ?? 'es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)

  const isPage = variant === 'page'

  return (
    <aside
      className={
        isPage
          ? 'bg-sand-50 border border-sand-300 rounded-xl p-6 lg:p-7 flex flex-col gap-3.5 lg:sticky lg:top-24 self-start h-fit'
          : 'bg-sand-50 border-t border-sand-300 px-5 lg:px-6 py-5 flex flex-col gap-3'
      }
    >
      {isPage && (
        <h2 className="font-serif text-[22px] lg:text-[24px] text-ink-900 mb-1">
          {t('summaryHeading')}
        </h2>
      )}

      <div className="flex justify-between text-[14px] lg:text-[14.5px] text-ink-800">
        <span>{t('subtotal')}</span>
        <span>{fmt(subtotal)} DOP</span>
      </div>

      <div className="flex justify-between text-[12.5px] lg:text-[13.5px] text-ink-500">
        <span>{t('shipping')}</span>
        <em className="not-italic text-ink-700">{t('shippingHint')}</em>
      </div>

      {isPage && (
        <>
          <div className="h-px bg-sand-300 my-1.5" />
          <div className="flex items-baseline justify-between mt-0.5">
            <div className="text-[13px] tracking-[0.04em] text-ink-700">
              {t('subtotalCaps')}
            </div>
            <div className="font-serif text-[28px] lg:text-[32px] text-ink-900 leading-none whitespace-nowrap">
              {fmt(subtotal)}
              <span className="ml-1.5 font-sans text-[12px] lg:text-[13px] text-ink-500 font-medium tracking-[0.04em]">
                DOP
              </span>
            </div>
          </div>
        </>
      )}

      {error && (
        <div
          role="alert"
          className="bg-brick-600/10 border border-brick-600/25 text-brick-600 text-[13px] rounded-lg px-3 py-2"
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onReserve}
        disabled={reserving}
        className={
          (isPage ? 'mt-2 h-13' : 'h-12') +
          ' rounded-xl bg-clay-700 hover:bg-clay-800 text-sand-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center leading-tight'
        }
        style={isPage ? { height: 52 } : undefined}
      >
        {reserving ? (
          <span className="inline-flex items-center gap-2 text-[14.5px]">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('reserving')}
          </span>
        ) : (
          <>
            <span className="text-[15.5px]">{t('reserveButton')}</span>
            <span className="text-[11px] font-normal opacity-85 tracking-[0.06em] mt-0.5">
              {t('reserveSubLabel')}
            </span>
          </>
        )}
      </button>

      {!hideTrustSignals && isPage && (
        <div className="grid grid-cols-2 gap-3 mt-3 text-[11.5px] text-ink-500 leading-[1.4]">
          <div className="flex flex-col gap-0.5">
            <strong className="text-ink-800 font-semibold text-[12px]">
              {t('trustNoPayment.title')}
            </strong>
            {t('trustNoPayment.body')}
          </div>
          <div className="flex flex-col gap-0.5">
            <strong className="text-ink-800 font-semibold text-[12px]">
              {t('trustPharmacist.title')}
            </strong>
            {t('trustPharmacist.body')}
          </div>
        </div>
      )}

      {!isPage && (
        <p className="text-[11px] text-ink-500 text-center mt-0.5">
          {t('trustNoPayment.body')}
        </p>
      )}
    </aside>
  )
}
