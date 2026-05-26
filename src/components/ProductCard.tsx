import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AddToCartButton } from './AddToCartButton'
import { ProductCardHeart } from './ProductCardHeart'

type ProductImage = { url: string; alt: string | null }
export type ProductCardBadge = 'new' | 'promo' | 'best'

type Product = {
  id: string
  /** Optional: when missing, the link falls back to the UUID and /product/[slug]
   *  performs a 308 redirect to the canonical slug URL. */
  slug?: string
  name: string
  price: number
  oldPrice?: number
  currency: string
  images?: ProductImage[]
  brand?: string
  /** Sous-marque (range) — affichée en eyebrow après la marque si présente. */
  range?: string
  /** Description courte — montrée sous le titre quand fournie. */
  description?: string
  /** Override explicite — sinon dérivé depuis oldPrice / isNew / isFeatured. */
  badge?: ProductCardBadge
  inStock?: boolean
  isNew?: boolean
  isFeatured?: boolean
  /** Niveau de stock restant — déclenche un état `low` sous LOW_STOCK_THRESHOLD. */
  stock?: number
  /** Suffixe unité (ex: "50 ml") rendu en mono après le prix. */
  volume?: string | null
}

type Props = { product: Product }

const LOW_STOCK_THRESHOLD = 5

/**
 * Carte produit du catalogue (refonte Sprint 4).
 *
 * Stretched link : un `<Link>` absolu couvre la carte avec z-index inférieur
 * aux contrôles interactifs, évitant l'imbrication `<button>` dans `<a>` tout
 * en gardant la card cliquable et préservant le right-click "Open in new tab".
 */
export default function ProductCard({ product }: Props) {
  const t = useTranslations('Catalogue')
  const inStock = product.inStock ?? true
  const stock = product.stock
  const lowStock = inStock && stock !== undefined && stock > 0 && stock <= LOW_STOCK_THRESHOLD
  const outOfStock = !inStock || stock === 0
  const isPromo = product.oldPrice !== undefined && product.oldPrice > product.price
  const promoPct = isPromo
    ? Math.round((1 - product.price / product.oldPrice!) * 100)
    : 0
  const badge: ProductCardBadge | undefined =
    product.badge ??
    (isPromo ? 'promo' : product.isNew ? 'new' : product.isFeatured ? 'best' : undefined)
  const href = `/product/${product.slug ?? product.id}`

  return (
    <article
      data-testid="product-card"
      className={`group relative flex flex-col bg-sand-50 border border-sand-200 transition-[border-color,transform] duration-150 hover:border-ink-900 hover:-translate-y-0.5 overflow-hidden ${
        outOfStock ? 'opacity-60' : ''
      }`}
    >
      <Link
        href={href}
        prefetch={false}
        aria-label={product.name}
        className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
      />

      <div className="relative aspect-[4/5] bg-gradient-to-br from-sand-100 to-sand-200 overflow-hidden flex items-center justify-center">
        {badge && <ProductBadge kind={badge} promoPct={promoPct} />}
        <ProductCardHeart
          productId={product.id}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-sand-50/85 backdrop-blur-sm border border-sand-300 flex items-center justify-center"
        />
        <Image
          src={product.images?.[0]?.url ?? '/placeholder.png'}
          alt={product.images?.[0]?.alt ?? product.name}
          width={400}
          height={500}
          className="w-3/5 h-4/5 object-contain"
        />
        {!outOfStock && (
          <AddToCartButton
            productId={product.id}
            variant="card-cta-quick"
            className="absolute left-3.5 right-3.5 bottom-3.5 z-20 opacity-0 translate-y-3.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
            label={`+ ${t('addToCart')}`}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5 flex-1 px-5 pt-5 pb-5.5">
        {product.brand && (
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-clay-700 truncate">
            {product.brand}
            {product.range ? ` · ${product.range}` : ''}
          </div>
        )}
        <h3 className="font-serif text-[22px] leading-[1.15] -tracking-[0.012em] text-ink-900 line-clamp-2 min-h-[2.3em]">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[13px] leading-[1.45] text-ink-500 flex-1 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex justify-between items-baseline pt-3 mt-1.5 border-t border-sand-200">
          <div className="font-serif text-[24px] leading-none -tracking-[0.01em] text-ink-900">
            {isPromo && (
              <span className="block font-mono text-[12px] text-ink-500 line-through mb-0.5">
                {product.oldPrice!.toFixed(0)} {product.currency.toUpperCase()}
              </span>
            )}
            {product.price.toFixed(0)}
            <small className="font-mono text-[11px] text-ink-500 tracking-[0.06em] ml-1">
              {product.currency.toUpperCase()}
              {product.volume ? ` / ${product.volume}` : ''}
            </small>
          </div>
          <StockBadge state={outOfStock ? 'out' : lowStock ? 'low' : 'in'} stock={stock} />
        </div>
      </div>
    </article>
  )
}

function ProductBadge({ kind, promoPct }: { kind: ProductCardBadge; promoPct: number }) {
  const t = useTranslations('Catalogue')
  const styles = {
    new: 'bg-olive-600 text-sand-50 border-olive-600',
    promo: 'bg-brick-600 text-sand-50 border-brick-600',
    best: 'bg-clay-700 text-sand-50 border-clay-700',
  } as const

  let label: string
  if (kind === 'promo') label = t('flagPromo', { percent: promoPct })
  else if (kind === 'new') label = t('flagNew')
  else label = t('flagBestseller')

  return (
    <span
      className={`absolute top-3.5 left-3.5 z-20 font-mono text-[10px] uppercase tracking-[0.14em] py-1 px-2.5 rounded-[2px] border ${styles[kind]}`}
    >
      {label}
    </span>
  )
}

function StockBadge({ state, stock }: { state: 'in' | 'low' | 'out'; stock?: number }) {
  const t = useTranslations('Catalogue')
  const color =
    state === 'out'
      ? 'text-ink-500 before:bg-ink-400'
      : state === 'low'
        ? 'text-brick-600 before:bg-clay-600'
        : 'text-olive-600 before:bg-[#8AB672]'
  const label =
    state === 'out'
      ? t('stockOut')
      : state === 'low' && stock !== undefined
        ? t('stockLow', { count: stock })
        : t('stockInStock')

  return (
    <span
      className={`font-mono text-[11px] tracking-[0.06em] inline-flex items-center before:content-[''] before:inline-block before:w-1.5 before:h-1.5 before:rounded-full before:mr-1.5 before:align-middle ${color}`}
    >
      {label}
    </span>
  )
}
