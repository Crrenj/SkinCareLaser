'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { useCart } from '@/hooks/useCart'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { CartSummary } from '@/components/cart/CartSummary'
import { CartEmpty } from '@/components/cart/CartEmpty'

export default function CartClient() {
  const t = useTranslations('Cart')
  const tRes = useTranslations('Reservation')
  const router = useRouter()
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice, refreshCart } = useCart()

  const productsCount = items.length
  const unitsCount = useMemo(() => items.reduce((acc, it) => acc + it.quantity, 0), [items])

  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)
  const [reservationId, setReservationId] = useState<string | null>(null)

  const handleReserve = useCallback(async () => {
    setReserving(true)
    setReserveError(null)
    try {
      const res = await fetch('/api/cart/reserve', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        switch (json.code) {
          case 'auth_required':
            router.push('/login?next=/cart')
            return
          case 'phone_required':
            router.push('/account/profile?required=phone&from=/cart')
            return
          case 'already_active':
            setReserveError(t('errors.alreadyActive'))
            return
          case 'cart_empty':
            setReserveError(t('errors.cartEmpty'))
            return
          default:
            setReserveError(json.error || t('errors.generic'))
            return
        }
      }
      setReservationId(json.reservationId)
      await refreshCart()
    } catch {
      setReserveError(t('errors.network'))
    } finally {
      setReserving(false)
    }
  }, [router, refreshCart, t])

  const handleClearCart = useCallback(() => {
    if (typeof window !== 'undefined' && window.confirm(t('clearCartConfirm'))) {
      clearCart()
    }
  }, [clearCart, t])

  /* ─────────── Branche 1 : confirmation post-réservation ─────────── */
  if (reservationId) {
    const shortRef = reservationId.slice(0, 8).toUpperCase()
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-sand-50 border border-sand-300 rounded-2xl shadow-sm p-8 text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-16 w-16 text-olive-600" />
          </div>
          <h1 className="font-serif text-[28px] text-ink-900 mb-3">{tRes('successTitle')}</h1>
          <p className="text-ink-700 mb-2">
            {tRes('referenceLabel')}{' '}
            <span className="font-mono font-semibold">#{shortRef}</span>
          </p>
          <p className="text-ink-700 mb-6">
            {tRes.rich('successDescription', {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <Link
            href="/catalogue"
            className="inline-flex items-center justify-center px-6 py-3 bg-clay-700 text-sand-50 rounded-lg hover:bg-clay-800 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tRes('backToCatalogue')}
          </Link>
        </div>
      </div>
    )
  }

  /* ─────────── Branche 2 : panier vide ─────────── */
  if (items.length === 0) {
    return <CartEmpty />
  }

  /* ─────────── Branche 3 : panier rempli ─────────── */
  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-12 py-4 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 lg:gap-12">
        {/* Colonne articles */}
        <div>
          <h1 className="font-serif text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.01em] text-ink-900 mb-1">
            {t('title')}
            <span className="ml-3 align-middle font-sans text-[13px] lg:text-[14px] font-normal text-ink-500 tracking-[0.04em]">
              {t('subtitle', { products: productsCount, units: unitsCount })}
            </span>
          </h1>

          <div className="border-t border-sand-300 mt-6">
            {items.map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                variant="page"
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          <div className="flex justify-between items-center mt-6 pt-2 gap-3">
            <Link
              href="/catalogue"
              className="text-[13.5px] text-ink-700 border-b border-transparent hover:border-current pb-0.5 transition-colors"
            >
              {t('continueShopping')}
            </Link>
            <button
              type="button"
              onClick={handleClearCart}
              className="text-[12.5px] text-ink-500 underline underline-offset-4 hover:text-brick-600 transition-colors"
            >
              {t('clearCart')}
            </button>
          </div>
        </div>

        {/* Colonne résumé (sticky desktop, en bas mobile via order) */}
        <CartSummary
          subtotal={totalPrice}
          variant="page"
          onReserve={handleReserve}
          reserving={reserving}
          error={reserveError}
        />
      </div>
    </div>
  )
}
