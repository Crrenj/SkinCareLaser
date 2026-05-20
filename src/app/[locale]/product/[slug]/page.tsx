import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getTranslations } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ProductClient from '@/components/ProductClient'
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
    .select('name, description, image_url, product_images(url), product_ranges(range:ranges(name, brand:brands(name)))')
    .eq('slug', slug)
    .maybeSingle()

  const t = await getTranslations({ locale, namespace: 'PageMeta.product' })

  if (!prod) {
    return { title: t('titleTemplate', { name: '', brand: '' }) }
  }

  const ranges = (prod.product_ranges ?? []) as unknown as Array<{
    range: { name: string; brand: { name: string } | null } | null
  }>
  const brandName = ranges[0]?.range?.brand?.name ?? ''
  const productName = prod.name
  const description = (prod.description ?? '').trim()

  const title = t('titleTemplate', { name: productName, brand: brandName })
  const desc = description
    ? t('descriptionWithDesc', { name: productName, brand: brandName, description })
    : t('descriptionFallback', { name: productName, brand: brandName })

  const imageUrl =
    prod.image_url ??
    (Array.isArray(prod.product_images) && prod.product_images[0]?.url) ??
    undefined

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
  range: { id: string; name: string; brand: { id: string; name: string } | null } | null
}
type TagJoin = { tag: TagItem | null }

type RawProduct = {
  id: string
  name: string
  description: string | null
  price: string | number
  currency: string
  slug: string
  product_images: { url: string; alt: string | null }[] | null
  product_ranges: RangeJoin[] | null
  product_tags: TagJoin[] | null
}

type MappedProduct = {
  id: string
  name: string
  description: string
  price: number
  currency: string
  slug: string
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
  product_images ( url, alt ),
  product_ranges (
    range:ranges (
      id,
      name,
      brand:brands ( id, name )
    )
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

function mapProduct(raw: RawProduct): MappedProduct {
  const firstRange = raw.product_ranges?.[0]?.range ?? null
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    price: Number(raw.price),
    currency: raw.currency,
    slug: raw.slug,
    images: raw.product_images ?? [],
    brand: firstRange?.brand?.name ?? '',
    range: firstRange?.name ?? '',
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
    if (pErr) console.error('Product fetch error:', pErr)
    notFound()
  }

  const mainProduct = mapProduct(prodRaw)
  const rangeId = prodRaw.product_ranges?.[0]?.range?.id

  // 2. Produits similaires — étape A (même gamme)
  const { data: sameRange } = rangeId
    ? await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('product_ranges.range_id', rangeId)
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
  const mainTags = mainProduct.tagsByCategory

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

  const similarProducts: MappedProduct[] = [...(sameRange ?? []), ...stepB].map(mapProduct)

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />
      <main id="main-content" className="flex-grow">
        <ProductClient
          product={mainProduct}
          similarProducts={similarProducts}
        />
      </main>
      <Footer />
    </div>
  )
}
