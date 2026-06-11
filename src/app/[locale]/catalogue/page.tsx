import { logger } from '@/lib/logger'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createSupabasePublicClient } from '@/lib/supabasePublic'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import dynamic from 'next/dynamic'

const CatalogueClient = dynamic(() => import('@/components/CatalogueClient'), {
  loading: () => (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="h-10 w-48 rounded bg-sand-200 animate-pulse mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-sand-200 animate-pulse" />
        ))}
      </div>
    </div>
  ),
})
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'
import {
  parseFilters,
  deriveBrandTreeModel,
  buildSelectionFromModel,
  type CatalogueProduct,
  type FacetedCounts,
} from '@/lib/catalogueFilters'
import { applyPromo } from '@/lib/pricing'
import { safeJsonLd } from '@/lib/jsonLd'

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
type RangeVocabRow = {
  name: string
  brand: { name: string } | null
  products: { id: string }[] | null
}

/** Forme des items renvoyés par la RPC get_catalogue_page (jsonb). */
type RpcItem = {
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
  effective_price: string | number | null
  brand: string
  range: string
  images: { url: string; alt: string | null }[]
  tags: { label: string; category: string }[]
}

type RpcResult = {
  total: number
  total_all: number
  page: number
  items: RpcItem[]
  facets: {
    brands: Record<string, number>
    ranges: Record<string, number>
    tags: Record<string, Record<string, number>>
  }
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
  const supabase = createSupabasePublicClient()

  // 1) Vocabulaire de filtres (léger) : gammes + marques ayant ≥ 1 produit
  //    actif, et tous les tags par type. Indispensable AVANT la RPC :
  //    parseFilters résout les params URL (nom exact OU slug accentué) contre
  //    ces listes — contrat figé par catalogueFilters.test.ts (G-3a).
  const [{ data: rangeRows, error: rErr }, { data: tags, error: tErr }] = await Promise.all([
    supabase
      .from('ranges')
      .select('name, brand:brands!inner(name), products!inner(id)')
      .eq('products.is_active', true)
      .limit(1, { referencedTable: 'products' })
      .returns<RangeVocabRow[]>(),
    supabase
      .from('tags_with_types')
      .select('name, tag_type')
      .returns<TagItem[]>(),
  ])

  if (rErr || tErr) {
    logger.error(rErr || tErr)
    return <p className="p-6">{t('loadError')}</p>
  }

  const itemsByType: Record<string, string[]> = {}
  tags?.forEach((tg) => {
    itemsByType[tg.tag_type] ??= []
    itemsByType[tg.tag_type].push(tg.name)
  })
  Object.keys(itemsByType).forEach((tagType) => {
    itemsByType[tagType].sort()
  })

  const rangesByBrand: Record<string, string[]> = {}
  for (const row of rangeRows ?? []) {
    const brandName = row.brand?.name
    if (!brandName) continue
    rangesByBrand[brandName] ??= []
    if (!rangesByBrand[brandName].includes(row.name)) rangesByBrand[brandName].push(row.name)
  }
  Object.keys(rangesByBrand).forEach((b) => rangesByBrand[b].sort())

  const allBrands = Object.keys(rangesByBrand).sort()
  const allRanges = Object.values(rangesByBrand).flat()

  const parsed = parseFilters(sp, allBrands, allRanges, itemsByType, rangesByBrand)

  // Normalisation arbre Marque → Gammes : derive + rebuild produit la forme
  // canonique (marques pleines dans brands, sélections partielles dans pairs,
  // jamais de noms de gammes nus). Les MÊMES valeurs normalisées alimentent
  // la RPC ET les props client — l'arbre affiché correspond toujours au
  // résultat filtré, y compris pour un deep-link dégénéré ?brand=X&range=Y.
  const treeSelection = buildSelectionFromModel(
    deriveBrandTreeModel(parsed.brands, parsed.ranges, parsed.pairs, rangesByBrand),
  )
  const filters = { ...parsed, ...treeSelection }

  // 2) Filtrage + tri + pagination + facettes EN SQL (RPC get_catalogue_page,
  //    migration 20260611150000) — fini le .limit(500) qui droppait le
  //    catalogue au-delà de 500 produits. q est normalisé comme la colonne
  //    générée name_search (minuscules + sans accents) → recherche
  //    accent-insensible (D-4).
  const qNormalized = filters.q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  const { data: rpcData, error: rpcErr } = await supabase.rpc('get_catalogue_page', {
    p_brands: filters.brands,
    p_ranges: filters.ranges,
    p_pairs: filters.pairs,
    p_tags: filters.tags,
    p_q: qNormalized,
    p_sort: filters.sort,
    p_page: filters.page,
    p_page_size: PRODUCTS_PER_PAGE,
  })

  if (rpcErr || !rpcData) {
    logger.error(rpcErr)
    return <p className="p-6">{t('loadError')}</p>
  }

  const result = rpcData as RpcResult

  // 3) Mapping items → CatalogueProduct + swap prix promo (applyPromo, règle
  //    unique du barré : oldPrice = max(base, old_price manuel)).
  const pageProducts: CatalogueProduct[] = (result.items ?? []).map((p) => {
    const base = Number(p.price)
    const { price, oldPrice } = applyPromo(
      base,
      p.old_price != null ? Number(p.old_price) : undefined,
      { base, effective: p.effective_price != null ? Number(p.effective_price) : base },
    )
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      price,
      oldPrice,
      currency: p.currency,
      stock: p.stock ?? undefined,
      isNew: p.is_new ?? false,
      isFeatured: p.is_featured ?? false,
      volume: p.volume,
      images: p.images ?? [],
      brand: p.brand ?? '',
      range: p.range ?? '',
      tags: p.tags ?? [],
    }
  })

  const totalPages = Math.max(1, Math.ceil(result.total / PRODUCTS_PER_PAGE))
  const counts: FacetedCounts = {
    brands: result.facets?.brands ?? {},
    ranges: result.facets?.ranges ?? {},
    tags: result.facets?.tags ?? {},
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('jsonLdName'),
    description: t('jsonLdDescription'),
    url: localizedPath(locale, '/catalogue'),
    numberOfItems: result.total_all,
  }

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />
      <main id="main-content" className="flex-grow">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
        <CatalogueClient
          products={pageProducts}
          visibleCount={result.total}
          totalCount={result.total_all}
          currentPage={result.page}
          totalPages={totalPages}
          sortBy={filters.sort}
          availableBrands={allBrands}
          rangesByBrand={rangesByBrand}
          itemsByType={itemsByType}
          selectedBrands={filters.brands}
          selectedRanges={filters.ranges}
          selectedPairs={filters.pairs}
          selectedTags={filters.tags}
          searchTerm={filters.q}
          productCounts={counts}
        />
      </main>
      <Footer />
    </div>
  )
}
