'use client'

import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { CartItem } from '@/types/cart'
import { formatPrice } from '@/lib/formatPrice'

type CartLineItemProps = {
  item: CartItem
  variant: 'page' | 'drawer'
  /** Renvoie une promesse pour pouvoir surveiller la mise à jour. */
  onUpdateQuantity: (productId: string, quantity: number) => Promise<unknown>
  onRemove: (productId: string) => Promise<unknown>
  busy?: boolean
}

function useFormatNumber() {
  const locale = useLocale()
  return (n: number) => formatPrice(n, { locale })
}

export function CartLineItem({
  item,
  variant,
  onUpdateQuantity,
  onRemove,
  busy = false,
}: CartLineItemProps) {
  const t = useTranslations('Cart')
  const format = useFormatNumber()

  if (!item.product) return null
  const p = item.product
  const unitPrice = p.price
  const lineTotal = unitPrice * item.quantity
  const isPromo = p.oldPrice != null && p.oldPrice > unitPrice
  const slug = p.id // pas de slug exposé dans le CartItem actuel — fallback id

  const handleDec = () => {
    if (item.quantity > 1) onUpdateQuantity(item.product_id, item.quantity - 1)
  }
  const handleInc = () => {
    if (item.quantity < (p.stock || 99)) {
      onUpdateQuantity(item.product_id, item.quantity + 1)
    }
  }

  /* ─────────── Drawer (compact) ─────────── */
  if (variant === 'drawer') {
    return (
      <div
        className={`grid grid-cols-[64px_1fr_28px] gap-3 px-6 py-3.5 border-b border-sand-200 last:border-b-0 items-start ${
          busy ? 'opacity-60' : ''
        }`}
        data-testid="cart-item"
      >
        <div className="w-16 h-16 rounded-md bg-sand-200 overflow-hidden flex items-center justify-center text-ink-500 text-[9px] tracking-[0.1em] uppercase">
          {p.images[0] ? (
            <Image
              src={p.images[0].url}
              alt={p.images[0].alt || p.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              sizes="64px"
            />
          ) : (
            'Pack'
          )}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          {p.brand && (
            <span className="text-[10.5px] tracking-[0.16em] uppercase text-clay-700 font-semibold">
              {p.brand}
            </span>
          )}
          <span className="text-[13.5px] font-medium text-ink-900 leading-[1.3] line-clamp-2">
            {p.name}
          </span>
          <div className="flex items-center justify-between mt-1.5">
            <QtyStepper
              value={item.quantity}
              onDec={handleDec}
              onInc={handleInc}
              busy={busy}
              size="sm"
            />
            <span className="font-serif text-[16px] text-ink-900 leading-none">
              {format(lineTotal)}{' '}
              <span className="font-sans text-[10.5px] text-ink-500">DOP</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.product_id)}
          disabled={busy}
          className="w-7 h-7 flex items-center justify-center text-ink-500 hover:text-brick-600 rounded transition-colors disabled:opacity-50"
          aria-label={t('removeAriaLabel', { name: p.name })}
          data-testid="remove-item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  /* ─────────── Page (desktop + mobile 2-row) ─────────── */
  return (
    <article
      className={`border-b border-sand-300 py-5 lg:py-6 ${busy ? 'opacity-60' : ''}`}
      data-testid="cart-item"
    >
      {/* Desktop : 5 colonnes alignées · Mobile : 2 rangées (image+texte+delete / qty+total) */}
      <div className="grid grid-cols-[72px_1fr_28px] lg:grid-cols-[96px_1fr_auto_auto_36px] gap-3 lg:gap-6 items-start lg:items-center">
        {/* Image */}
        <div className="w-[72px] h-[72px] lg:w-24 lg:h-24 rounded-md lg:rounded-lg bg-sand-200 overflow-hidden flex items-center justify-center text-ink-500 text-[10px] tracking-[0.1em] uppercase">
          {p.images[0] ? (
            <Image
              src={p.images[0].url}
              alt={p.images[0].alt || p.name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
              sizes="(min-width: 1024px) 96px, 72px"
            />
          ) : (
            t('noImage')
          )}
        </div>

        {/* Info produit */}
        <div className="flex flex-col gap-0.5 min-w-0">
          {p.brand && (
            <span className="text-[11px] tracking-[0.16em] uppercase text-clay-700 font-semibold">
              {p.brand}
            </span>
          )}
          <h3 className="text-[14px] lg:text-[15.5px] font-medium text-ink-900 leading-[1.35]">
            <Link
              href={`/product/${slug}`}
              className="hover:underline underline-offset-4"
            >
              {p.name}
            </Link>
          </h3>
          <p className="text-[12px] lg:text-[13px] text-ink-500 mt-0.5">
            {p.volume && (
              <>
                {p.volume} <span aria-hidden>·</span>{' '}
              </>
            )}
            {isPromo && (
              <span className="line-through text-ink-400 mr-1.5">{format(p.oldPrice!)}</span>
            )}
            {format(unitPrice)} DOP
          </p>
        </div>

        {/* Delete (mobile en col 3, desktop en col 5) */}
        <button
          type="button"
          onClick={() => onRemove(item.product_id)}
          disabled={busy}
          className="lg:hidden w-7 h-7 flex items-center justify-center text-ink-500 hover:text-brick-600 rounded transition-colors disabled:opacity-50"
          aria-label={t('removeAriaLabel', { name: p.name })}
          data-testid="remove-item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Qty stepper (desktop col 3) */}
        <div className="hidden lg:block">
          <QtyStepper
            value={item.quantity}
            onDec={handleDec}
            onInc={handleInc}
            busy={busy}
          />
        </div>

        {/* Total (desktop col 4) */}
        <div className="hidden lg:block text-right min-w-[120px] font-serif text-[22px] text-ink-900 leading-[1.1]">
          {format(lineTotal)}
          <span className="block font-sans text-[11px] text-ink-500 tracking-[0.06em] font-medium mt-0.5">
            DOP
          </span>
        </div>

        {/* Delete (desktop col 5) */}
        <button
          type="button"
          onClick={() => onRemove(item.product_id)}
          disabled={busy}
          className="hidden lg:flex w-9 h-9 items-center justify-center text-ink-500 hover:text-brick-600 hover:bg-sand-100 rounded-md transition-colors disabled:opacity-50"
          aria-label={t('removeAriaLabel', { name: p.name })}
          data-testid="remove-item"
        >
          <Trash2 className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Mobile row 2 : qty + total alignés sous le texte (pl-[84px]) */}
      <div className="flex items-center justify-between mt-2.5 pl-[84px] lg:hidden">
        <QtyStepper
          value={item.quantity}
          onDec={handleDec}
          onInc={handleInc}
          busy={busy}
        />
        <span className="font-serif text-[18px] text-ink-900">
          {format(lineTotal)} <span className="font-sans text-[12px] text-ink-500">DOP</span>
        </span>
      </div>
    </article>
  )
}

function QtyStepper({
  value,
  onDec,
  onInc,
  busy = false,
  size = 'md',
}: {
  value: number
  onDec: () => void
  onInc: () => void
  busy?: boolean
  size?: 'sm' | 'md'
}) {
  const t = useTranslations('Cart')
  const dims =
    size === 'sm'
      ? { h: 'h-7', btn: 'w-7 h-7', text: 'text-[13px] min-w-[22px]' }
      : { h: 'h-9', btn: 'w-8 h-9', text: 'text-[14px] min-w-[30px]' }

  return (
    <div
      className={`inline-flex items-center bg-sand-50 border border-sand-300 rounded-lg overflow-hidden ${dims.h}`}
    >
      <button
        type="button"
        onClick={onDec}
        disabled={busy || value <= 1}
        className={`${dims.btn} text-ink-700 hover:bg-sand-100 hover:text-ink-900 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
        aria-label={t('decreaseQuantityAriaLabel')}
        data-testid="quantity-decrease"
      >
        −
      </button>
      <span className={`${dims.text} text-center font-medium`} data-testid="quantity-display">
        {value}
      </span>
      <button
        type="button"
        onClick={onInc}
        disabled={busy}
        className={`${dims.btn} text-ink-700 hover:bg-sand-100 hover:text-ink-900 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
        aria-label={t('increaseQuantityAriaLabel')}
        data-testid="quantity-increase"
      >
        +
      </button>
    </div>
  )
}
