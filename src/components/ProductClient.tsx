'use client'

import { logger } from '@/lib/logger'
import { useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useCart } from '@/hooks/useCart'
import Breadcrumb from '@/components/Breadcrumb'
import ProductCard from '@/components/ProductCard'
import { Link } from '@/i18n/navigation'
import { Info } from 'lucide-react'
import { PdpGallery } from '@/components/pdp/PdpGallery'
import { PdpAccordions, type PdpAccordionData } from '@/components/pdp/PdpAccordions'
import { PdpReservationPanel } from '@/components/pdp/PdpReservationPanel'
import { PdpReviews, type ReviewItem } from '@/components/pdp/PdpReviews'
import { PdpStickyBar } from '@/components/pdp/PdpStickyBar'
import { buildRestockWhatsappLink } from '@/lib/whatsapp'

export type MappedProduct = {
  id: string
  slug: string
  name: string
  description?: string
  price: number
  oldPrice?: number
  currency: string
  images: { url: string; alt: string | null }[]
  brand: string
  range: string
  tagsByCategory: Record<string, string[]>
  // Champs optionnels — backés par DB plus tard (spec §07 schéma)
  volume?: string
  stock?: number | null
  benefits?: string[]
  usage?: string
  inci?: string
  technicalPdfUrl?: string
  pharmacistAdvice?: string
  pharmacistName?: string
}

interface ProductClientProps {
  product: MappedProduct
  similarProducts: MappedProduct[]
  reviews: ReviewItem[]
  reviewAverage: number
  reviewCount: number
  /** Numéro WhatsApp boutique (shop_settings) — CTA réassort quand épuisé. */
  whatsappNumber?: string | null
}

export default function ProductClient({
  product,
  similarProducts,
  reviews,
  reviewAverage,
  reviewCount,
  whatsappNumber,
}: ProductClientProps) {
  const t = useTranslations('Product')
  const tCat = useTranslations('Catalogue')
  const locale = useLocale()
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()
  const buyRowRef = useRef<HTMLDivElement | null>(null)

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-ink-500">{t('notFound')}</p>
      </div>
    )
  }

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, quantity)
    } catch (error) {
      logger.error('Erreur ajout au panier:', error)
    }
  }

  const outOfStock = product.stock === 0
  // Produit épuisé → lien WhatsApp pré-rempli « quand sera-t-il réapprovisionné ? »
  // (même mécanique que le lien de coordination des réservations). Le fallback
  // /contact (numéro non configuré) est préfixé par la locale courante —
  // localePrefix 'always' redirigerait sinon vers la locale du cookie.
  const rawRestockLink = outOfStock ? buildRestockWhatsappLink(product.name, whatsappNumber) : null
  const restockLink =
    rawRestockLink && !rawRestockLink.startsWith('http') ? `/${locale}${rawRestockLink}` : rawRestockLink
  const isPromo = product.oldPrice != null && product.oldPrice > product.price
  const promoPct = isPromo ? Math.round((1 - product.price / product.oldPrice!) * 100) : 0

  // Accordéons recadrés sur la fiche modernisée : on garde uniquement
  // Description et Composition · INCI (décision actée — pas de Bénéfices,
  // Mode d'emploi ni Fiche technique sur la fiche FARMAU).
  const accordionData: PdpAccordionData = {
    description: product.description || undefined,
    inci: product.inci,
  }

  // Breadcrumb : Accueil › Catalogue › Marque › Gamme › Nom
  const breadcrumbItems = [
    { href: '/', label: t('breadcrumb.home') },
    { href: '/catalogue', label: t('breadcrumb.catalogue') },
    ...(product.brand
      ? [{ href: `/catalogue?brand=${encodeURIComponent(product.brand)}`, label: product.brand }]
      : []),
    ...(product.range
      ? [{ href: `/catalogue?range=${encodeURIComponent(product.range)}`, label: product.range }]
      : []),
    { label: product.name, current: true },
  ]

  return (
    <div className="bg-sand-50">
      <Breadcrumb items={breadcrumbItems} />

      {/* ── HERO ── */}
      <section className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 px-6 lg:px-8 py-10 lg:py-14 max-w-7xl mx-auto lg:items-start">
        {/* Gallery sticky pendant le scroll de la colonne info à droite */}
        <div className="lg:sticky lg:top-32">
          <PdpGallery images={product.images} name={product.name} />
        </div>

        <div className="pt-2">
          {product.brand && (
            <Link
              href={`/catalogue?brand=${encodeURIComponent(product.brand)}`}
              className="inline-block text-[12px] uppercase tracking-[0.16em] text-clay-700 font-semibold hover:text-clay-800 mb-2"
            >
              {product.brand}
            </Link>
          )}

          <h1 className="font-serif text-[36px] lg:text-[44px] leading-[1.02] -tracking-[0.015em] text-ink-900 mb-3 text-balance">
            {product.name}
          </h1>

          {product.range && (
            <div className="font-serif italic text-[17px] text-ink-500 mb-7">
              {t('rangePrefix')}{' '}
              <Link
                href={`/catalogue?range=${encodeURIComponent(product.range)}`}
                className="underline decoration-sand-400 underline-offset-[3px] hover:decoration-clay-600"
              >
                {product.range}
              </Link>
            </div>
          )}

          <div className="flex items-baseline gap-4 mb-2">
            <div className="font-serif text-[36px] lg:text-[40px] text-ink-900 leading-none -tracking-[0.015em]">
              {product.price.toFixed(0)}
              <span className="font-sans text-[15px] text-ink-500 tracking-wider ml-1.5 font-medium">
                {product.currency.toUpperCase()}
              </span>
            </div>
            {isPromo && (
              <span className="font-sans text-[20px] text-ink-400 line-through">
                {product.oldPrice!.toFixed(0)}
              </span>
            )}
            {isPromo && (
              <span className="text-[12px] font-semibold text-clay-700 bg-clay-100 px-2 py-0.5 rounded-full">
                {tCat('flagPromo', { percent: promoPct })}
              </span>
            )}
            {product.volume && (
              <span className="text-[13px] text-ink-500">· {product.volume}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[12px] text-ink-500 mb-4">
            <Info size={13} strokeWidth={1.7} className="shrink-0" />
            {t('priceNote')}
          </div>

          <div className="mb-6">
            {outOfStock ? (
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-brick-600 bg-brick-600/10 border border-brick-600/25 px-3 py-1.5 rounded-full">
                <span aria-hidden className="w-2 h-2 rounded-full bg-brick-600" />
                {t('availabilityOut')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-olive-700 bg-olive-100 border border-olive-600/30 px-3 py-1.5 rounded-full">
                <span aria-hidden className="w-2 h-2 rounded-full bg-olive-600" />
                {t('availability')}
              </span>
            )}
          </div>

          <div ref={buyRowRef}>
            <PdpReservationPanel
              productId={product.id}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onReserve={handleAddToCart}
              maxQuantity={product.stock ?? undefined}
              outOfStock={outOfStock}
              restockLink={restockLink}
            />
          </div>
        </div>
      </section>

      {/* ── ACCORDIONS (Description + Composition · INCI) ── */}
      <PdpAccordions data={accordionData} />

      {/* ── REVIEWS ── */}
      <PdpReviews
        productId={product.id}
        reviews={reviews}
        average={reviewAverage}
        count={reviewCount}
      />

      {/* ── SIMILAR PRODUCTS ── */}
      {similarProducts.length > 0 && (
        <section className="px-6 lg:px-8 py-14 max-w-7xl mx-auto">
          <div className="flex justify-between items-baseline mb-6 gap-4 flex-wrap">
            <h2 className="font-serif text-[28px] lg:text-[32px] -tracking-[0.01em]">
              {t('similar.heading')}
            </h2>
            {product.range && (
              <Link
                href={`/catalogue?range=${encodeURIComponent(product.range)}`}
                className="text-[12.5px] text-clay-700 underline decoration-clay-200 underline-offset-[3px] hover:text-clay-800"
              >
                {t('similar.seeRange', { range: product.range })}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {similarProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  description: p.description,
                  price: p.price,
                  oldPrice: p.oldPrice,
                  currency: p.currency,
                  images: p.images.map((img) => ({ url: img.url, alt: img.alt || '' })),
                  brand: p.brand,
                  range: p.range,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── STICKY BAR mobile ── */}
      <PdpStickyBar
        buyRowRef={buyRowRef}
        productName={product.name}
        price={product.price}
        oldPrice={product.oldPrice}
        currency={product.currency}
        disabled={outOfStock}
        onAdd={handleAddToCart}
        restockLink={restockLink}
      />
    </div>
  )
}
