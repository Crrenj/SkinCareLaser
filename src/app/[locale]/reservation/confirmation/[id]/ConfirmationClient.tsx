'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ListChecks, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
  buildReservationMessage,
  buildReservationWhatsappLink,
  type ReservationPayload,
} from '@/lib/whatsapp'
import { PICKUP_LOCATIONS } from '@/lib/shipping'
import { buildReservationReference } from '@/lib/reservation'
import { ConfirmationHeader } from '@/components/confirmation/ConfirmationHeader'
import { WhatsappHero } from '@/components/confirmation/WhatsappHero'
import { ReservationTimeline } from '@/components/confirmation/ReservationTimeline'
import {
  ConfirmationRecap,
  type ConfirmationAddress,
  type ConfirmationItem,
  type ConfirmationShipping,
} from '@/components/confirmation/ConfirmationRecap'
import { StickyMobileCta } from '@/components/confirmation/StickyMobileCta'

type Props = {
  reservationId: string
  contactName: string
  contactPhone: string
  totalPrice: number
  createdAt: string | null
  items: ConfirmationItem[]
}

type DraftSnapshot = {
  reservationId?: string
  address?: ConfirmationAddress
  shipping?: ConfirmationShipping
  note?: string
  email?: string
  subtotal?: number
}

// Référence FAR-YYYYMMDD-XXXX — factorisée dans @/lib/reservation.

export default function ConfirmationClient({
  reservationId,
  contactName,
  contactPhone,
  totalPrice,
  createdAt,
  items,
}: Props) {
  const t = useTranslations('Reservation.confirmation')
  const reference = useMemo(
    () => buildReservationReference(reservationId, createdAt),
    [reservationId, createdAt],
  )

  // Récupère le snapshot brouillon posé par le tunnel pour reconstituer
  // adresse / livraison / note (non persistés en DB pour l'instant).
  const [draft, setDraft] = useState<DraftSnapshot | null>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem('farmau:reservation:last')
      if (!raw) return
      const parsed = JSON.parse(raw) as DraftSnapshot
      if (parsed.reservationId === reservationId) setDraft(parsed)
    } catch {
      // ignored
    }
  }, [reservationId])

  // Prénom pour la salutation H1 — privilégie le draft (frais), sinon contactName
  const firstName = (() => {
    if (draft?.address?.firstName) return draft.address.firstName
    if (contactName) return contactName.split(' ')[0]
    return undefined
  })()

  // Charge utile pour le lien WhatsApp pré-rempli
  const subtotal = draft?.subtotal ?? totalPrice
  const payload: ReservationPayload = useMemo(() => {
    const sh = draft?.shipping
    const pickup =
      sh?.kind === 'pickup'
        ? PICKUP_LOCATIONS.find((p) => p.id === sh.pickupId)
        : undefined

    const fallbackContact = {
      firstName: firstName ?? '',
      lastName: contactName?.split(' ').slice(1).join(' ') ?? '',
      phone: contactPhone || draft?.address?.phone || '',
      email: draft?.email,
    }

    const shipping: ReservationPayload['shipping'] =
      sh?.kind === 'pickup' && pickup
        ? { kind: 'pickup', pickup }
        : sh?.kind === 'delivery' && draft?.address
          ? {
              kind: 'delivery',
              zone: sh.zone,
              address: {
                street: draft.address.street,
                city: draft.address.city,
                postalCode: draft.address.postalCode,
              },
            }
          : // Sans draft : on coordonne juste par référence, pas d'adresse
            {
              kind: 'pickup',
              pickup:
                PICKUP_LOCATIONS[0] ??
                ({ id: 'main', name: 'FARMAU', address: '', hours: '', phone: '' } as const),
            }

    return {
      reference,
      contact: draft?.address
        ? {
            firstName: draft.address.firstName,
            lastName: draft.address.lastName,
            phone: draft.address.phone,
            email: draft.email,
          }
        : fallbackContact,
      shipping,
      items: items.map((it) => ({
        name: it.name,
        brand: it.brand,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
      })),
      subtotal,
      customerNote: draft?.note,
    }
  }, [reference, draft, items, subtotal, firstName, contactName, contactPhone])

  const whatsappUrl = useMemo(() => buildReservationWhatsappLink(payload), [payload])
  const messagePreview = useMemo(() => buildReservationMessage(payload), [payload])

  const heroCtaRef = useRef<HTMLAnchorElement | null>(null)

  return (
    <>
      <div className="max-w-[880px] mx-auto w-full px-4 lg:px-14 py-10 lg:py-14 flex flex-col gap-9 lg:gap-10 pb-24 lg:pb-14">
        <ConfirmationHeader reference={reference} firstName={firstName} />

        <WhatsappHero
          ref={heroCtaRef}
          whatsappUrl={whatsappUrl}
          messagePreview={messagePreview}
        />

        <ReservationTimeline reference={reference} />

        <ConfirmationRecap
          items={items}
          subtotal={subtotal}
          shipping={draft?.shipping}
          address={draft?.address}
          fallbackName={contactName}
          fallbackPhone={contactPhone}
          note={draft?.note}
          savedAt={createdAt}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Link
            href="/account/profile"
            className="flex items-center gap-3.5 px-5 py-4 bg-sand-50 border border-sand-300 rounded-xl text-ink-900 no-underline hover:border-sand-500 hover:bg-sand-100 transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-sand-100 flex items-center justify-center text-ink-700 shrink-0">
              <ListChecks className="w-[18px] h-[18px]" />
            </span>
            <span className="flex flex-col gap-0.5 text-[14px] font-medium leading-[1.3]">
              {t('secondaryReservations')}
              <small className="font-normal text-[12px] text-ink-500">
                {t('secondaryReservationsSub')}
              </small>
            </span>
          </Link>
          <Link
            href="/catalogue"
            className="flex items-center gap-3.5 px-5 py-4 bg-sand-50 border border-sand-300 rounded-xl text-ink-900 no-underline hover:border-sand-500 hover:bg-sand-100 transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-sand-100 flex items-center justify-center text-ink-700 shrink-0">
              <ArrowRight className="w-[18px] h-[18px]" />
            </span>
            <span className="flex flex-col gap-0.5 text-[14px] font-medium leading-[1.3]">
              {t('secondaryCatalogue')}
              <small className="font-normal text-[12px] text-ink-500">
                {t('secondaryCatalogueSub')}
              </small>
            </span>
          </Link>
        </div>
      </div>

      <StickyMobileCta observe={heroCtaRef} whatsappUrl={whatsappUrl} />
    </>
  )
}
