import { logger } from '@/lib/logger'
import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getTranslations } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
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
import { fetchEffectivePrices, applyPromo, type EffectivePrice } from '@/lib/pricing'
import { notFound, permanentRedirect } from 'next/navigation'
import { JSX } from 'react'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

export const revalidate = 60

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function redirectIfUuid(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
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
  const supabase = await createSupabaseServerClient()
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
  const supabase = await createSupabaseServerClient()

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
  const mainTagsByCategory = buildTagMap(prodRaw.product_tags)

  // Avis approuvés — liste affichée + agrégat (résumé PDP + aggregateRating JSON-LD).
  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('id, rating, title, body, author_name, verified_purchase, created_at')
    .eq('product_id', prodRaw.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50)
  const reviews = reviewRows ?? []
  const reviewCount = reviews.length
  const reviewAverage =
    reviewCount > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
      : 0

  // 2. Produits similaires — étape A (même gamme)
  const { data: sameRange } = rangeId
    ? await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('range_id', rangeId)
        .neq('id', prodRaw.id)
        .limit(3)
        .returns<RawProduct[]>()
    : { data: null }

  // 3. Produits similaires — étape B (tags communs par catégorie)
  const { data: candidates } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .neq('id', prodRaw.id)
    .limit(50)
    .returns<RawProduct[]>()

  const wantCats = ['skin_type', 'category', 'need']
  const mainTags = mainTagsByCategory

  const stepB = (candidates ?? [])
    .filter(p => {
      const mapB = buildTagMap(p.product_tags)
      return wantCats.every(
        cat =>
          Array.isArray(mainTags[cat]) &&
          Array.isArray(mapB[cat]) &&
          mainTags[cat].some(v => mapB[cat].includes(v))
      )
    })
    .slice(0, 2)

  const similarRaw = [...(sameRange ?? []), ...stepB]
  // Prix effectifs (promo) en batch pour le produit principal + similaires.
  const priceMap = await fetchEffectivePrices(supabase, [prodRaw.id, ...similarRaw.map((p) => p.id)])
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
        />
      </main>
      <Footer />
    </div>
  )
}
