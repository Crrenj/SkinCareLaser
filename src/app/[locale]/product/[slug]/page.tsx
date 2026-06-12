import { logger } from '@/lib/logger'
import type { Metadata } from 'next'
import { createSupabasePublicClient } from '@/lib/supabasePublic'
import { getTranslations } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import dynamic from 'next/dynamic'

const ProductClient = dynamic(() => import('@/components/ProductClient'), {
  loading: () => (
    <div className="mx-auto max-w-7xl px-4 py-12 grid md:grid-cols-2 gap-8">
      <div className="aspect-square rounded bg-sand-200 animate-pulse" />
      <div className="space-y-4">
        <div className="h-8 w-64 rounded bg-sand-200 animate-pulse" />
        <div className="h-6 w-32 rounded bg-sand-200 animate-pulse" />
        <div className="h-24 w-full rounded bg-sand-200 animate-pulse" />
      </div>
    </div>
  ),
})
import { ProductJsonLd } from '@/components/pdp/ProductJsonLd'
import { getShopSettings } from '@/lib/getShopSettings'
import { fetchEffectivePrices, applyPromo, type EffectivePrice } from '@/lib/pricing'
import { notFound, permanentRedirect } from 'next/navigation'
import { JSX } from 'react'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

export const revalidate = 60

/**
 * Aucun slug prérendu au build (catalogue volumineux) : generateStaticParams
 * vide → la route reste statique-éligible, chaque slug est généré à la
 * demande puis mis en cache ISR (revalidate ci-dessus).
 */
export function generateStaticParams() {
  return []
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function redirectIfUuid(
  supabase: ReturnType<typeof createSupabasePublicClient>,
  locale: string,
  handle: string,
): Promise<void> {
  if (!UUID_RE.test(handle)) return
  const { data } = await supabase
    .from('products')
    .select('slug')
    .eq('id', handle)
    .maybeSingle()
  if (data?.slug) {
    permanentRedirect(`/${locale}/product/${data.slug}`)
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = createSupabasePublicClient()
  await redirectIfUuid(supabase, locale, slug)

  const { data: prod } = await supabase
    .from('products')
    .select('name, description, product_images(url), range:ranges(name, brand:brands(name))')
    .eq('slug', slug)
    .maybeSingle()

  const t = await getTranslations({ locale, namespace: 'PageMeta.product' })

  if (!prod) {
    return { title: t('titleTemplate', { name: '', brand: '' }) }
  }

  const range = prod.range as unknown as { name: string; brand: { name: string } | null } | null
  const brandName = range?.brand?.name ?? ''
  const productName = prod.name
  const description = (prod.description ?? '').trim()

  const title = t('titleTemplate', { name: productName, brand: brandName })
  const desc = description
    ? t('descriptionWithDesc', { name: productName, brand: brandName, description })
    : t('descriptionFallback', { name: productName, brand: brandName })

  const imageUrl =
    (Array.isArray(prod.product_images) && prod.product_images[0]?.url) ?? undefined

  return {
    title,
    description: desc,
    alternates: {
      canonical: localizedPath(locale, `/product/${slug}`),
      languages: buildLanguageAlternates(`/product/${slug}`),
    },
    openGraph: {
      title,
      description: desc,
      locale,
      type: 'website',
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  }
}

type TagItem = { name: string; tag_type: string }

type RangeJoin = {
  id: string
  name: string
  brand: { id: string; name: string } | null
}
type TagJoin = { tag: TagItem | null }

type RawProduct = {
  id: string
  name: string
  description: string | null
  price: string | number
  currency: string
  slug: string
  stock: number | null
  product_images: { url: string; alt: string | null }[] | null
  range: RangeJoin | null
  product_tags: TagJoin[] | null
}

type MappedProduct = {
  id: string
  name: string
  description: string
  price: number
  oldPrice?: number
  currency: string
  slug: string
  stock: number | null
  images: { url: string; alt: string | null }[]
  brand: string
  range: string
  tagsByCategory: Record<string, string[]>
}

const PRODUCT_SELECT = `
  id,
  name,
  description,
  price,
  currency,
  slug,
  stock,
  product_images ( url, alt ),
  range:ranges (
    id,
    name,
    brand:brands ( id, name )
  ),
  product_tags (
    tag:tags_with_types ( name, tag_type )
  )
`

function buildTagMap(rawTags: TagJoin[] | null): Record<string, string[]> {
  return (rawTags ?? []).reduce<Record<string, string[]>>((acc, { tag }) => {
    if (!tag) return acc
    acc[tag.tag_type] ??= []
    acc[tag.tag_type].push(tag.name)
    return acc
  }, {})
}

function mapProduct(raw: RawProduct, pricing?: EffectivePrice): MappedProduct {
  const { price, oldPrice } = applyPromo(Number(raw.price), null, pricing)
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    price,
    oldPrice,
    currency: raw.currency,
    slug: raw.slug,
    stock: raw.stock,
    images: raw.product_images ?? [],
    brand: raw.range?.brand?.name ?? '',
    range: raw.range?.name ?? '',
    tagsByCategory: buildTagMap(raw.product_tags),
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<JSX.Element> {
  const { locale, slug } = await params
  const supabase = createSupabasePublicClient()

  await redirectIfUuid(supabase, locale, slug)

  // 1. Fetch produit principal
  const { data: prodRaw, error: pErr } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .single<RawProduct>()

  if (pErr || !prodRaw) {
    if (pErr) logger.error('Product fetch error:', pErr)
    notFound()
  }

  const rangeId = prodRaw.range?.id

  // Combien de produits similaires au total (priorité : même gamme d'abord,
  // puis un complément ciblé). Inchangé : jusqu'à 3 même-gamme + 2 complément.
  const SAME_RANGE_LIMIT = 3
  const COMPLEMENT_LIMIT = 2
  const SIMILAR_LIMIT = SAME_RANGE_LIMIT + COMPLEMENT_LIMIT

  // 2. Tout ce qui ne dépend que du produit principal en parallèle :
  //    avis approuvés + produits actifs de la même gamme + un pool ciblé
  //    d'autres produits actifs (pour combler le complément). Plus de
  //    « charger 50 produits puis filtrer en JS » : chaque requête est bornée
  //    et explicitement filtrée sur is_active = true.
  const [
    { data: reviewRows },
    { data: sameRangeRaw },
    { data: complementPoolRaw },
  ] = await Promise.all([
    // Avis approuvés — liste affichée + agrégat (résumé PDP + aggregateRating JSON-LD).
    supabase
      .from('reviews')
      .select('id, rating, title, body, author_name, verified_purchase, created_at')
      .eq('product_id', prodRaw.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50),
    // Similaires — priorité 1 : produits actifs de la même gamme (requête ciblée).
    rangeId
      ? supabase
          .from('products')
          .select(PRODUCT_SELECT)
          .eq('range_id', rangeId)
          .neq('id', prodRaw.id)
          .eq('is_active', true)
          .limit(SAME_RANGE_LIMIT)
          .returns<RawProduct[]>()
      : Promise.resolve({ data: null as RawProduct[] | null }),
    // Similaires — priorité 2 : pool ciblé d'autres produits actifs pour combler
    // le complément. On sur-récupère légèrement (+ même-gamme) pour pouvoir
    // dédupliquer ce qui chevauche la même gamme avant de couper au manque réel.
    supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .neq('id', prodRaw.id)
      .eq('is_active', true)
      .limit(SIMILAR_LIMIT + SAME_RANGE_LIMIT)
      .returns<RawProduct[]>(),
  ])

  const reviews = reviewRows ?? []
  const reviewCount = reviews.length
  const reviewAverage =
    reviewCount > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
      : 0

  const sameRange = sameRangeRaw ?? []
  const seen = new Set<string>(sameRange.map((p) => p.id))
  const complement = (complementPoolRaw ?? [])
    .filter((p) => !seen.has(p.id))
    .slice(0, SIMILAR_LIMIT - sameRange.length)

  const similarRaw = [...sameRange, ...complement]
  // Prix effectifs (promo) en batch pour le produit principal + similaires.
  // Prix effectifs + settings boutique (numéro WhatsApp pour le CTA réassort
  // d'un produit épuisé) — getShopSettings est cookieless + unstable_cache,
  // ne casse pas l'éligibilité statique de la route.
  const [priceMap, shopSettings] = await Promise.all([
    fetchEffectivePrices(supabase, [prodRaw.id, ...similarRaw.map((p) => p.id)]),
    getShopSettings(),
  ])
  const mainProduct = mapProduct(prodRaw, priceMap.get(prodRaw.id))
  const similarProducts: MappedProduct[] = similarRaw.map((p) => mapProduct(p, priceMap.get(p.id)))

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <ProductJsonLd
        locale={locale}
        slug={mainProduct.slug}
        name={mainProduct.name}
        description={mainProduct.description}
        brand={mainProduct.brand}
        price={mainProduct.price}
        currency={mainProduct.currency}
        images={mainProduct.images}
        stock={mainProduct.stock}
        ratingValue={reviewAverage}
        reviewCount={reviewCount}
      />
      <NavBar />
      <main id="main-content" className="flex-grow">
        <ProductClient
          product={mainProduct}
          similarProducts={similarProducts}
          reviews={reviews}
          reviewAverage={reviewAverage}
          reviewCount={reviewCount}
          whatsappNumber={shopSettings.whatsapp_number}
        />
      </main>
    </div>
  )
}
