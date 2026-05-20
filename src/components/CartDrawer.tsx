'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { useCart } from '@/hooks/useCart'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { CartSummary } from '@/components/cart/CartSummary'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const t = useTranslations('Cart')
  const router = useRouter()
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart()

  const [reserving, setReserving] = useState(false)
  const [reserveError] = useState<string | null>(null)

  /* Scroll-lock + Esc */
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  // "Reservar" depuis le drawer → ferme + ouvre le tunnel /reservation
  const handleReserve = useCallback(() => {
    setReserving(true)
    onClose()
    router.push('/reservation')
  }, [router, onClose])

  const handleClearCart = useCallback(() => {
    if (typeof window !== 'undefined' && window.confirm(t('clearCartConfirm'))) {
      clearCart()
    }
  }, [clearCart, t])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('drawerTitle')}
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-sand-50 shadow-2xl
                    flex flex-col transform transition-transform duration-200 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        data-testid="cart-drawer"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-sand-300 shrink-0">
          <h2 className="font-serif text-[22px] lg:text-[24px] text-ink-900 m-0">
            {t('drawerTitle')}
            <span className="ml-2 font-sans text-[12px] text-ink-500 font-normal">
              {t('drawerProductsCount', { count: totalItems })}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-ink-700 hover:bg-sand-100 hover:text-ink-900 transition-colors"
            aria-label={t('drawerClose')}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Liste items (scrollable) */}
        <div className="flex-1 overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center text-ink-500 text-[14px]">
              {t('empty.title')} <em className="text-clay-700 not-italic">{t('empty.titleEmphasis')}</em>.
            </div>
          ) : (
            items.map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                variant="drawer"
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))
          )}
        </div>

        {/* Footer summary */}
        {items.length > 0 && (
          <div className="shrink-0">
            <CartSummary
              subtotal={totalPrice}
              variant="drawer"
              onReserve={handleReserve}
              reserving={reserving}
              error={reserveError}
            />
            <button
              type="button"
              onClick={handleClearCart}
              className="block w-full text-center text-[12px] text-ink-500 underline underline-offset-4 hover:text-brick-600 transition-colors pb-5"
            >
              {t('clearCart')}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
