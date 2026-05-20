'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useCart } from '@/hooks/useCart'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { CartSummary } from '@/components/cart/CartSummary'
import { CartEmpty } from '@/components/cart/CartEmpty'

export default function CartClient() {
  const t = useTranslations('Cart')
  const router = useRouter()
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart()

  const productsCount = items.length
  const unitsCount = useMemo(() => items.reduce((acc, it) => acc + it.quantity, 0), [items])

  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)

  // "Reservar" depuis /cart → ouvre simplement le tunnel /reservation.
  // Les guards auth + phone + cart_empty + already_active sont gérés en
  // amont par le Server Component de la page /reservation.
  const handleReserve = useCallback(() => {
    setReserving(true)
    setReserveError(null)
    router.push('/reservation')
  }, [router])

  const handleClearCart = useCallback(() => {
    if (typeof window !== 'undefined' && window.confirm(t('clearCartConfirm'))) {
      clearCart()
    }
  }, [clearCart, t])

  /* ─────────── Branche 1 : panier vide ─────────── */
  if (items.length === 0) {
    return <CartEmpty />
  }

  /* ─────────── Branche 2 : panier rempli ─────────── */
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
