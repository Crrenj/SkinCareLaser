'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useCart } from '@/hooks/useCart'
import { useModalA11y } from '@/hooks/useModalA11y'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { PopClose } from '@/components/ui/PopClose'
import { Scrim } from '@/components/ui/Scrim'
import { CartDrawerSummary } from '@/components/cart/CartDrawerSummary'

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
  const bodyRef = useRef<HTMLDivElement>(null)
  const [headerBordered, setHeaderBordered] = useState(false)
  const dialogRef = useModalA11y<HTMLElement>(isOpen, onClose)

  useEffect(() => {
    const el = bodyRef.current
    if (!el || !isOpen) return
    const onScroll = () => setHeaderBordered(el.scrollTop > 2)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [isOpen])

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
      <Scrim visible={isOpen} onClick={onClose} />

      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('drawerTitle')}
        tabIndex={-1}
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-sand-50 flex flex-col
                    rounded-tl-[--pop-radius-drawer] rounded-bl-[--pop-radius-drawer]
                    shadow-[--pop-shadow-drawer-r] overflow-hidden
                    transform transition-transform duration-200
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          transitionTimingFunction: 'var(--pop-ease)',
          boxShadow: 'var(--pop-shadow-drawer-r)',
        }}
        data-testid="cart-drawer"
      >
        {/* Header — border only on scroll */}
        <header className={`flex items-start justify-between px-[22px] py-[18px] shrink-0 transition-[border-color] duration-150 ${
          headerBordered ? 'border-b border-sand-200' : 'border-b border-transparent'
        }`}>
          <div>
            <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium mb-1">
              {t('drawerEyebrow') ?? 'Mi pedido'}
            </span>
            <h2 className="font-serif text-[22px] text-ink-900 m-0 leading-[1.1] flex items-baseline gap-2">
              {t('drawerTitle')}
              <span className="text-clay-700 italic text-[18px]">
                — {totalItems}
              </span>
            </h2>
          </div>
          <PopClose onClick={onClose} label={t('drawerClose')} />
        </header>

        {/* Body (scrollable) */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-[22px] py-[14px]">
          {items.length === 0 ? (
            <div className="py-16 text-center text-ink-500 text-[14px]">
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

        {/* Footer with summary card + CTA */}
        {items.length > 0 && (
          <div className="shrink-0 relative">
            {/* Scroll-fade gradient */}
            <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-b from-transparent to-sand-50 pointer-events-none" />
            <div className="px-[22px] pb-[18px] pt-[14px]">
              <CartDrawerSummary
                subtotal={totalPrice}
                itemCount={totalItems}
                onReserve={handleReserve}
                reserving={reserving}
                error={reserveError}
              />
              <button
                type="button"
                onClick={handleClearCart}
                className="block w-full text-center text-[12px] text-ink-500 underline underline-offset-[3px] hover:text-brick-600 transition-colors py-1 mt-1"
              >
                {t('clearCart')}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
