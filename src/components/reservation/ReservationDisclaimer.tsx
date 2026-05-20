'use client'

import { useTranslations } from 'next-intl'

/**
 * Disclaimer "Esto es una reserva, no un pago." — obligatoire à chaque étape
 * du tunnel + dans le récapitulatif. Bordure gauche clay-700, fond sand-100.
 */
export function ReservationDisclaimer({ className = '' }: { className?: string }) {
  const t = useTranslations('Reservation')
  return (
    <div
      role="note"
      className={
        'bg-sand-100 border-l-[3px] border-clay-700 rounded-r-lg px-4 py-3.5 text-[12.5px] leading-[1.55] text-ink-800 ' +
        className
      }
    >
      {t.rich('disclaimer', {
        strong: (chunks) => <strong className="text-ink-900 font-semibold">{chunks}</strong>,
      })}
    </div>
  )
}
