import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { AddToCartButton } from './AddToCartButton'

type ProductImage = { url: string; alt: string | null }
export type ProductCardBadge = 'new' | 'promo' | 'best'

type Product = {
  id: string
  name: string
  price: number
  oldPrice?: number
  currency: string
  images?: ProductImage[]
  brand?: string
  badge?: ProductCardBadge
  inStock?: boolean
  /** Non rendu sur la carte (sprint 2) — conservé pour compat call sites existants. */
  description?: string
  /** La gamme est portée par la PDP, plus par la carte. */
  range?: string
}

type Props = { product: Product }

export default function ProductCard({ product }: Props) {
  const inStock = product.inStock ?? true
  const isPromo = product.oldPrice !== undefined && product.oldPrice > product.price

  return (
    <Link
      href={`/product/${product.id}`}
      prefetch={false}
      className="group block h-full"
    >
      <article
        data-testid="product-card"
        className="relative flex flex-col h-full p-3.5 bg-white rounded-md border border-sand-300 transition-all duration-[240ms] ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_32px_-12px_rgba(31,27,22,0.16),0_2px_4px_rgba(31,27,22,0.04)]"
      >
        {/* IMAGE */}
        <div className="relative aspect-square mb-4 overflow-hidden rounded bg-sand-50">
          {product.badge && (
            <ProductBadge
              kind={product.badge}
              oldPrice={product.oldPrice}
              price={product.price}
            />
          )}
          <div
            className={`flex items-center justify-center w-full h-full p-[18%] ${
              !inStock ? 'opacity-35' : ''
            }`}
          >
            <Image
              src={product.images?.[0]?.url ?? '/placeholder.png'}
              alt={product.images?.[0]?.alt ?? product.name}
              width={400}
              height={400}
              className="w-full h-full object-contain"
            />
          </div>
          {inStock && (
            <AddToCartButton
              productId={product.id}
              variant="icon"
              className="absolute bottom-2.5 right-2.5 w-9 h-9 opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
            />
          )}
        </div>

        {/* BRAND eyebrow */}
        {product.brand && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay-700 mb-1.5 truncate">
            {product.brand}
          </div>
        )}

        {/* NAME */}
        <h3 className="text-[15.5px] font-medium text-ink-900 leading-[1.3] line-clamp-2 mb-3.5 text-balance min-h-[2.6em]">
          {product.name}
        </h3>

        {/* PRICE + CTA */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-sand-200">
          <div className="font-serif text-2xl text-ink-900 leading-none tracking-[-0.01em]">
            {isPromo && (
              <span className="font-sans text-[13px] text-ink-400 line-through mr-2 align-[4px]">
                {product.oldPrice!.toFixed(0)}
              </span>
            )}
            {product.price.toFixed(0)}
            <span className="font-sans text-[14px] text-ink-500 tracking-wide ml-1">
              {product.currency.toUpperCase()}
            </span>
          </div>
          <AddToCartButton
            productId={product.id}
            variant="card-cta"
            disabled={!inStock}
          />
        </div>
      </article>
    </Link>
  )
}

function ProductBadge({
  kind,
  oldPrice,
  price,
}: {
  kind: ProductCardBadge
  oldPrice?: number
  price: number
}) {
  const styles = {
    new: 'bg-ink-900 text-sand-50',
    promo: 'bg-clay-700 text-sand-50',
    best: 'bg-clay-200 text-clay-800',
  } as const

  let label: string
  if (kind === 'promo' && oldPrice && oldPrice > price) {
    const pct = Math.round((1 - price / oldPrice) * 100)
    label = `−${pct}%`
  } else if (kind === 'new') {
    label = 'Nouveau'
  } else {
    label = 'Bestseller'
  }

  return (
    <span
      className={`absolute top-2.5 left-2.5 z-10 text-[10px] font-mono font-medium uppercase tracking-[0.08em] px-2 py-1 rounded-sm ${styles[kind]}`}
    >
      {label}
    </span>
  )
}
