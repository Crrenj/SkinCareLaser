import { logger } from '@/lib/logger'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import CatalogueClient from '@/components/CatalogueClient'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'
import {
  parseFilters,
  filterProducts,
  computeFacetedCounts,
  type CatalogueProduct,
} from '@/lib/catalogueFilters'

export const revalidate = 60

const PRODUCTS_PER_PAGE = 24

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.catalogue' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/catalogue'),
      languages: buildLanguageAlternates('/catalogue'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

type TagItem = { name: string; tag_type: string }
type RangeJoin = {
  id: string
  name: string
  brand: { id: string; name: string } | null
}
type RawProduct = {
  id: string
  slug: string
  name: string
  price: string | number
  old_price: string | number | null
  currency: string
  stock: number | null
  is_new: boolean | null
  is_featured: boolean | null
  volume: string | null
  product_images: { url: string; alt: string | null }[] | null
  range: RangeJoin | null
  product_tags: { tag: TagItem | null }[] | null
}

export default async function Catalogue({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  const sp = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('Catalogue')
  const supabase = await createSupabaseServerClient()

  const { data: products, error: pErr } = await supabase
    .from('products')
    .select(`
      id,
      slug,
      name,
      price,
      old_price,
      currency,
      stock,
      is_new,
      is_featured,
      volume,
      product_images ( url, alt ),
      range:ranges (
        id,
        name,
        brand:brands ( id, name )
      ),
      product_tags (
        tag:tags_with_types ( name, tag_type )
      )
    `)
    .eq('is_active', true)
    .limit(500)
    .returns<RawProduct[]>()

  const { data: tags, error: tErr } = await supabase
    .from('tags_with_types')
    .select('name, tag_type')
    .returns<TagItem[]>()

  if (pErr || tErr) {
    logger.error(pErr || tErr)
    return <p className="p-6">{t('loadError')}</p>
  }

  const itemsByType: Record<string, string[]> = {}
  tags?.forEach(tg => {
    itemsByType[tg.tag_type] ??= []
    itemsByType[tg.tag_type].push(tg.name)
  })
  Object.keys(itemsByType).forEach(tagType => {
    itemsByType[tagType].sort()
  })

  const allProducts: CatalogueProduct[] = (products ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price),
    oldPrice: p.old_price !== null && p.old_price !== undefined ? Number(p.old_price) : undefined,
    currency: p.currency,
    stock: p.stock ?? undefined,
    isNew: p.is_new ?? false,
    isFeatured: p.is_featured ?? false,
    volume: p.volume,
    images: p.product_images ?? [],
    brand: p.range?.brand?.name ?? '',
    range: p.range?.name ?? '',
    tags: (p.product_tags ?? []).flatMap((pt) =>
      pt.tag ? [{ label: pt.tag.name, category: pt.tag.tag_type }] : [],
    ),
  }))

  const allBrands = Array.from(
    new Set(allProducts.map((p) => p.brand).filter(Boolean)),
  ).sort()

  const rangesByBrand: Record<string, string[]> = {}
  allProducts.forEach((p) => {
    if (p.brand && p.range) {
      rangesByBrand[p.brand] ??= []
      if (!rangesByBrand[p.brand].includes(p.range)) rangesByBrand[p.brand].push(p.range)
    }
  })
  Object.keys(rangesByBrand).forEach((b) => rangesByBrand[b].sort())

  const allRanges = Object.values(rangesByBrand).flat()
  const filters = parseFilters(sp, allBrands, allRanges, itemsByType)

  const filtered = filterProducts(allProducts, filters)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE))
  const page = Math.min(filters.page, totalPages)
  const startIndex = (page - 1) * PRODUCTS_PER_PAGE
  const pageProducts = filtered.slice(startIndex, startIndex + PRODUCTS_PER_PAGE)

  const counts = computeFacetedCounts(allProducts, filters, allBrands, rangesByBrand, itemsByType)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('jsonLdName'),
    description: t('jsonLdDescription'),
    url: localizedPath(locale, '/catalogue'),
    numberOfItems: allProducts.length,
  }

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />
      <main id="main-content" className="flex-grow">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CatalogueClient
          products={pageProducts}
          visibleCount={filtered.length}
          totalCount={allProducts.length}
          currentPage={page}
          totalPages={totalPages}
          sortBy={filters.sort}
          availableBrands={allBrands}
          rangesByBrand={rangesByBrand}
          itemsByType={itemsByType}
          selectedBrands={filters.brands}
          selectedRanges={filters.ranges}
          selectedTags={filters.tags}
          searchTerm={filters.q}
          productCounts={counts}
        />
      </main>
      <Footer />
    </div>
  )
}
