'use client'

import { logger } from '@/lib/logger'
import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCart } from '@/hooks/useCart'
import Breadcrumb from '@/components/Breadcrumb'
import ProductCard from '@/components/ProductCard'
import { Link } from '@/i18n/navigation'
import { PdpGallery } from '@/components/pdp/PdpGallery'
import { PdpStockBadge } from '@/components/pdp/PdpStockBadge'
import { PdpQuantity } from '@/components/pdp/PdpQuantity'
import { PdpWishlistButton } from '@/components/pdp/PdpWishlistButton'
import { PdpTrustSignals } from '@/components/pdp/PdpTrustSignals'
import { PdpAccordions, type PdpAccordionData } from '@/components/pdp/PdpAccordions'
import { PdpPharmacist } from '@/components/pdp/PdpPharmacist'
import { PdpStickyBar } from '@/components/pdp/PdpStickyBar'

export type MappedProduct = {
  id: string
  slug: string
  name: string
  description?: string
  price: number
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
}

export default function ProductClient({
  product,
  similarProducts,
}: ProductClientProps) {
  const t = useTranslations('Product')
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

  // Construit les data accordéons — chaque section ne s'affiche que si du
  // contenu existe, d'où l'ordre des fallbacks.
  const accordionData: PdpAccordionData = {
    description: product.description || undefined,
    benefits: product.benefits,
    usage: product.usage,
    inci: product.inci,
    technicalPdfUrl: product.technicalPdfUrl,
    technical: buildTechnicalSpecs(product),
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
            {product.volume && (
              <span className="text-[13px] text-ink-500">· {product.volume}</span>
            )}
          </div>
          <PdpStockBadge stock={product.stock ?? undefined} />

          <div
            ref={buyRowRef}
            className="grid grid-cols-[120px_1fr_52px] gap-3 mt-7 mb-4"
          >
            <PdpQuantity value={quantity} onChange={setQuantity} max={product.stock ?? undefined} />
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="h-[52px] bg-clay-700 text-on-accent rounded-sm font-semibold text-[14px] uppercase tracking-wider hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('addToCartCta')}
            </button>
            <PdpWishlistButton productId={product.id} />
          </div>

          <PdpTrustSignals />
        </div>
      </section>

      {/* ── ACCORDIONS ── */}
      <PdpAccordions data={accordionData} />

      {/* ── PHARMACIST (variant A/B, ne render rien si vide) ── */}
      <PdpPharmacist quote={product.pharmacistAdvice} name={product.pharmacistName} />

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
        currency={product.currency}
        disabled={outOfStock}
        onAdd={handleAddToCart}
      />
    </div>
  )
}

/**
 * Reconstruit une fiche technique à partir des tags existants (skin_type,
 * texture, etc.) tant que les colonnes dédiées n'existent pas en DB.
 * Si rien n'est dispo, retourne undefined (l'accordéon n'apparaît pas).
 */
function buildTechnicalSpecs(product: MappedProduct) {
  const tags = product.tagsByCategory
  const labelMap: Record<string, string> = {
    skin_type: 'Type de peau',
    texture: 'Texture',
    category: 'Catégorie',
    need: 'Besoin',
  }
  const specs: { label: string; value: string }[] = []
  for (const [key, label] of Object.entries(labelMap)) {
    const values = tags[key]
    if (values && values.length > 0) {
      specs.push({ label, value: values.join(', ') })
    }
  }
  if (product.volume) specs.push({ label: 'Volume', value: product.volume })
  return specs.length > 0 ? specs : undefined
}
