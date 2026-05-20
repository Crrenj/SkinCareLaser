'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { useCart } from '@/hooks/useCart'
import { SHIPPING_COSTS, zoneFromPostalCode } from '@/lib/shipping'
import {
  StepIndicator,
  type ReservationStep,
} from '@/components/reservation/StepIndicator'
import { ReservationSummary } from '@/components/reservation/ReservationSummary'
import { AddressStep, type AddressData } from '@/components/reservation/AddressStep'
import { ShippingStep, type ShippingSelection } from '@/components/reservation/ShippingStep'
import { ReviewStep } from '@/components/reservation/ReviewStep'

const STORAGE_KEY = 'farmau:reservation:draft'

type Draft = {
  address?: AddressData
  shipping?: ShippingSelection
  note?: string
}

type ReservationClientProps = {
  initialProfile: {
    firstName: string
    lastName: string
    phone: string
    email: string
  }
}

export default function ReservationClient({ initialProfile }: ReservationClientProps) {
  const t = useTranslations('Reservation')
  const tReview = useTranslations('Reservation.review')
  const router = useRouter()
  const { items, totalItems, totalPrice } = useCart()

  // Persistance brouillon dans sessionStorage pour survivre F5
  const [draft, setDraft] = useState<Draft>({})
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) setDraft(JSON.parse(raw) as Draft)
    } catch {
      // sessionStorage indisponible
    }
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch {
      // ignored
    }
  }, [draft])

  const [step, setStep] = useState<ReservationStep>('address')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Étapes complétées dérivées du draft
  const completed = useMemo<ReservationStep[]>(() => {
    const out: ReservationStep[] = []
    if (draft.address) out.push('address')
    if (draft.shipping) out.push('shipping')
    return out
  }, [draft])

  // Pré-fill adresse depuis profil + draft
  const initialAddress: AddressData = useMemo(
    () =>
      draft.address ?? {
        firstName: initialProfile.firstName,
        lastName: initialProfile.lastName,
        street: '',
        city: '',
        postalCode: '',
        phone: initialProfile.phone,
      },
    [draft.address, initialProfile],
  )

  // Pré-cocher la zone selon le CP saisi à l'étape 1
  const initialShipping: ShippingSelection = useMemo(() => {
    if (draft.shipping) return draft.shipping
    const cp = draft.address?.postalCode ?? ''
    return { zone: zoneFromPostalCode(cp) }
  }, [draft.shipping, draft.address?.postalCode])

  // CTA desktop (aside) délègue le submit du <form> ReviewStep
  const reviewFormRef = useRef<HTMLFormElement | null>(null)

  const handleAddressSubmit = useCallback(
    (data: AddressData) => {
      setDraft((d) => ({ ...d, address: data }))
      setStep('shipping')
    },
    [],
  )

  const handleShippingSubmit = useCallback(
    (sel: ShippingSelection) => {
      setDraft((d) => ({ ...d, shipping: sel }))
      setStep('review')
    },
    [],
  )

  const handleFinalSubmit = useCallback(
    async (note: string) => {
      setSubmitting(true)
      setError(null)
      try {
        const res = await fetch('/api/cart/reserve', { method: 'POST' })
        const json = await res.json()
        if (!res.ok) {
          switch (json.code) {
            case 'auth_required':
              router.push('/login?next=/reservation')
              return
            case 'phone_required':
              router.push('/account/profile?required=phone&from=/reservation')
              return
            case 'already_active':
              setError(t('errors.already_active'))
              return
            case 'cart_empty':
              setError(t('errors.cart_empty'))
              return
            default:
              setError(json.error || t('errors.generic'))
              return
          }
        }
        // Conserver le brouillon (adresse + envío + note) avec l'id pour
        // que la page confirmation puisse construire le lien WhatsApp.
        try {
          sessionStorage.setItem(
            'farmau:reservation:last',
            JSON.stringify({
              ...draft,
              note,
              reservationId: json.reservationId,
              email: initialProfile.email,
              subtotal: totalPrice,
            }),
          )
          sessionStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignored
        }
        router.push(`/reservation/confirmation/${json.reservationId}`)
      } catch {
        setError(t('errors.generic'))
      } finally {
        setSubmitting(false)
      }
    },
    [draft, initialProfile.email, router, t, totalPrice],
  )

  // Si le panier vide arrive en cours (race condition refresh), retour cart
  useEffect(() => {
    if (totalItems === 0) router.replace('/cart')
  }, [totalItems, router])

  const handleEdit = (s: ReservationStep) => setStep(s)

  // Submit aside (desktop) → demande au form ReviewStep de soumettre
  const triggerReviewSubmit = () => reviewFormRef.current?.requestSubmit()

  // Helpers résumé
  const shippingZone = draft.shipping?.zone
  const shippingCost = shippingZone ? SHIPPING_COSTS[shippingZone] : 0

  return (
    <div className="flex flex-col">
      {/* Bandeau étapes */}
      <div className="bg-sand-100 border-b border-sand-300">
        <StepIndicator current={step} completed={completed} onEdit={handleEdit} />
      </div>
      {/* Mobile compact indicator */}
      <div className="lg:hidden">
        <StepIndicator current={step} completed={completed} compact />
      </div>

      <div className="max-w-[1280px] mx-auto w-full px-4 lg:px-14 py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 lg:gap-12">
        <div className="flex flex-col gap-8">
          {step === 'address' && (
            <AddressStep initial={initialAddress} onSubmit={handleAddressSubmit} />
          )}
          {step === 'shipping' && (
            <ShippingStep
              initial={initialShipping}
              onSubmit={handleShippingSubmit}
              onBack={() => setStep('address')}
            />
          )}
          {step === 'review' && draft.address && draft.shipping && (
            <ReviewStep
              items={items}
              address={draft.address}
              shipping={draft.shipping}
              initialNote={draft.note ?? ''}
              onEditAddress={() => setStep('address')}
              onEditShipping={() => setStep('shipping')}
              onSubmit={handleFinalSubmit}
              submitting={submitting}
              error={error}
              formRef={reviewFormRef}
            />
          )}
        </div>

        {/* Résumé latéral — desktop sticky */}
        <div className="hidden lg:block">
          <ReservationSummary
            items={items}
            subtotal={totalPrice}
            shippingZone={shippingZone}
            shippingCost={shippingCost}
            variant={
              step === 'review'
                ? 'review-aside'
                : step === 'shipping' && shippingZone
                  ? 'with-total'
                  : 'subtotal-only'
            }
            ctaSlot={
              step === 'review' ? (
                <>
                  <button
                    type="button"
                    onClick={triggerReviewSubmit}
                    disabled={submitting}
                    className="mt-3 h-14 rounded-xl bg-clay-700 hover:bg-clay-800 text-sand-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center leading-tight gap-0.5"
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2 text-[14.5px]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {tReview('submitting')}
                      </span>
                    ) : (
                      <>
                        <span className="text-[15px]">{tReview('cta')}</span>
                        <span className="text-[11px] font-normal opacity-85 tracking-[0.06em]">
                          {tReview('ctaSubLabel')}
                        </span>
                      </>
                    )}
                  </button>
                  <p className="text-[11.5px] text-ink-500 text-center leading-[1.5] mt-1">
                    {tReview('consent')}
                  </p>
                </>
              ) : undefined
            }
          />
        </div>
      </div>
    </div>
  )
}
