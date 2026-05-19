import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getTranslations } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ProductClient from '@/components/ProductClient'
import { notFound } from 'next/navigation'
import { JSX } from 'react'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: prod } = await supabase
    .from('products')
    .select('name, description, image_url, product_images(url), product_ranges(range:ranges(name, brand:brands(name)))')
    .eq('id', id)
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
      canonical: localizedPath(locale, `/product/${id}`),
      languages: buildLanguageAlternates(`/product/${id}`),
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

// Forme retournée par Supabase pour les jointures :
// PostgREST renvoie un object pour 1-1 et un array pour 1-n, mais nos relations
// (range, brand, tag) sont aliasées avec `name:relation` ce qui force un object.
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
    images: raw.product_images ?? [],
    brand: firstRange?.brand?.name ?? '',
    range: firstRange?.name ?? '',
    tagsByCategory: buildTagMap(raw.product_tags),
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<JSX.Element> {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  // 1. Fetch produit principal
  const { data: prodRaw, error: pErr } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
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
        .neq('id', id)
        .limit(3)
        .returns<RawProduct[]>()
    : { data: null }

  // 3. Produits similaires — étape B (tags communs par catégorie)
  const { data: candidates } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .neq('id', id)
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
