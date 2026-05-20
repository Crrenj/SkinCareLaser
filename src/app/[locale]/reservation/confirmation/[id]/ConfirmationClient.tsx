'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CheckCircle } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
  buildReservationWhatsappLink,
  type ReservationPayload,
} from '@/lib/whatsapp'
import { PICKUP_LOCATIONS, SHIPPING_COSTS } from '@/lib/shipping'

type ConfirmationClientProps = {
  reservationId: string
  contactName: string
  contactPhone: string
  totalPrice: number
}

type DraftSnapshot = {
  address?: {
    firstName: string
    lastName: string
    street: string
    city: string
    postalCode: string
    phone: string
  }
  shipping?:
    | { zone: 'santo_domingo' | 'interior' }
    | { zone: 'pickup'; pickupId: string }
  note?: string
  reservationId?: string
  email?: string
  subtotal?: number
}

const localeMap: Record<string, string> = { fr: 'fr-FR', es: 'es-DO', en: 'en-US' }

export default function ConfirmationClient({
  reservationId,
  contactName,
  contactPhone,
  totalPrice,
}: ConfirmationClientProps) {
  const t = useTranslations('Reservation')
  const locale = useLocale()
  const fmt = (n: number) =>
    new Intl.NumberFormat(localeMap[locale] ?? 'es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)

  const [draft, setDraft] = useState<DraftSnapshot | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem('farmau:reservation:last')
      if (raw) {
        const parsed = JSON.parse(raw) as DraftSnapshot
        if (parsed.reservationId === reservationId) setDraft(parsed)
      }
    } catch {
      // ignored
    }
  }, [reservationId])

  const shortRef = reservationId.slice(0, 8).toUpperCase()

  const whatsappLink = useMemo(() => {
    if (!draft?.address || !draft.shipping || draft.subtotal === undefined) {
      // Fallback : ouvre WhatsApp avec un message minimal si on a perdu le brouillon
      const phoneDigits =
        (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/g, '') || ''
      const msg = encodeURIComponent(
        `Hola FARMAU 👋, mi reserva es *#${shortRef}*.`,
      )
      return phoneDigits ? `https://wa.me/${phoneDigits}?text=${msg}` : '/contact'
    }
    const sh = draft.shipping
    const pickup =
      sh.zone === 'pickup' ? PICKUP_LOCATIONS.find((p) => p.id === sh.pickupId) : undefined

    const payload: ReservationPayload = {
      reference: shortRef,
      contact: {
        firstName: draft.address.firstName,
        lastName: draft.address.lastName,
        phone: draft.address.phone,
        email: draft.email,
      },
      shipping:
        sh.zone === 'pickup' && pickup
          ? { kind: 'pickup', pickup }
          : {
              kind: 'delivery',
              zone: (sh.zone === 'pickup' ? 'santo_domingo' : sh.zone) as
                | 'santo_domingo'
                | 'interior',
              address: {
                street: draft.address.street,
                city: draft.address.city,
                postalCode: draft.address.postalCode,
              },
            },
      items: [], // les items sont snapshotés en BDD ; on coordonne via le contenu de la réservation
      subtotal: draft.subtotal,
      customerNote: draft.note,
    }
    return buildReservationWhatsappLink(payload)
  }, [draft, shortRef])

  const shippingZone = draft?.shipping?.zone
  const shippingCost =
    shippingZone && shippingZone !== 'pickup' ? SHIPPING_COSTS[shippingZone] : 0
  const displayTotal = draft?.subtotal !== undefined ? draft.subtotal + shippingCost : totalPrice

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 lg:py-16">
      <div className="bg-sand-50 border border-sand-300 rounded-2xl p-8 lg:p-12 flex flex-col items-center gap-5 text-center">
        <CheckCircle className="w-16 h-16 text-olive-600" />
        <h1 className="font-serif text-[32px] lg:text-[40px] leading-[1.05] tracking-[-0.01em] text-ink-900">
          {t('successTitle')}
        </h1>
        <p className="text-[14px] text-ink-700">
          {t('referenceLabel')}{' '}
          <span className="font-mono font-semibold text-ink-900">#{shortRef}</span>
        </p>
        <p className="font-serif italic text-[17px] text-ink-700 max-w-md">
          {t('confirmationLede')}
        </p>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center justify-center gap-2.5 h-14 px-8 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-white font-medium text-[15.5px] transition-colors w-full sm:w-auto"
        >
          <WhatsappIcon />
          {t('openWhatsapp')}
        </a>

        <p className="text-[12.5px] text-ink-500 max-w-md leading-[1.6] mt-1">
          {t.rich('successDescription', {
            strong: (chunks) => <strong className="text-ink-700">{chunks}</strong>,
          })}
        </p>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full text-[13px] text-ink-700">
          <div className="bg-sand-100 rounded-lg p-3 flex flex-col gap-0.5">
            <span className="text-[11px] tracking-[0.14em] uppercase text-ink-500">
              {t('review.totalToCoordinate')}
            </span>
            <span className="font-serif text-[18px] text-ink-900">{fmt(displayTotal)} DOP</span>
          </div>
          <div className="bg-sand-100 rounded-lg p-3 flex flex-col gap-0.5">
            <span className="text-[11px] tracking-[0.14em] uppercase text-ink-500">
              {t('review.addressHeading')}
            </span>
            <span className="font-medium text-ink-800 leading-tight">
              {contactName || draft?.address?.firstName + ' ' + (draft?.address?.lastName ?? '')}
            </span>
          </div>
          <div className="bg-sand-100 rounded-lg p-3 flex flex-col gap-0.5">
            <span className="text-[11px] tracking-[0.14em] uppercase text-ink-500">
              WhatsApp
            </span>
            <span className="font-medium text-ink-800">{contactPhone}</span>
          </div>
        </div>

        <Link
          href="/catalogue"
          className="text-[13.5px] text-ink-700 underline underline-offset-4 hover:text-ink-900 mt-4 transition-colors"
        >
          {t('backToCatalogue')}
        </Link>
      </div>
    </div>
  )
}

function WhatsappIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12.001 2.002C6.479 2.002 2 6.482 2 12.001c0 1.954.567 3.78 1.547 5.314L2 22l4.81-1.514a9.95 9.95 0 0 0 5.191 1.46h.004c5.522 0 10.001-4.48 10.001-10.001 0-2.673-1.04-5.187-2.93-7.077a9.94 9.94 0 0 0-7.075-2.866Zm0 18.292h-.003a8.292 8.292 0 0 1-4.226-1.158l-.303-.18-3.137.987.998-3.057-.197-.314a8.29 8.29 0 0 1-1.27-4.387c0-4.58 3.726-8.305 8.308-8.305 2.219 0 4.305.864 5.872 2.434a8.252 8.252 0 0 1 2.436 5.875c-.002 4.58-3.727 8.305-8.478 8.105Zm4.555-6.18c-.249-.124-1.473-.726-1.702-.809-.228-.083-.394-.124-.56.124s-.642.808-.787.974c-.144.165-.29.186-.539.062-.249-.124-1.05-.387-2-1.232-.74-.66-1.238-1.474-1.383-1.723-.144-.249-.015-.382.11-.506.114-.114.249-.29.373-.435.124-.145.166-.249.249-.415.083-.165.041-.31-.021-.435-.062-.124-.56-1.347-.767-1.846-.202-.485-.408-.42-.561-.428-.144-.007-.31-.009-.476-.009-.166 0-.435.062-.663.31-.228.249-.871.851-.871 2.077s.892 2.408 1.016 2.574c.124.165 1.753 2.677 4.246 3.756.594.257 1.057.41 1.418.525.595.19 1.137.163 1.567.099.478-.071 1.473-.602 1.682-1.184.207-.582.207-1.082.145-1.183-.062-.103-.228-.165-.477-.29Z" />
    </svg>
  )
}
