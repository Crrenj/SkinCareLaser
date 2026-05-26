import type { SortKey } from '@/components/catalogue/CatalogueToolbar'

export interface CatalogueProduct {
  id: string
  slug: string
  name: string
  price: number
  oldPrice?: number
  currency: string
  stock?: number
  isNew: boolean
  isFeatured: boolean
  volume: string | null
  images: { url: string; alt: string | null }[]
  brand: string
  range: string
  tags: { label: string; category: string }[]
}

export interface FilterState {
  brands: string[]
  ranges: string[]
  tags: Record<string, string[]>
  q: string
  sort: SortKey
  page: number
}

export interface FacetedCounts {
  brands: Record<string, number>
  ranges: Record<string, number>
  tags: Record<string, Record<string, number>>
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function readMultiParam(sp: Record<string, string | string[] | undefined>, key: string): string[] {
  const val = sp[key]
  if (!val) return []
  const arr = Array.isArray(val) ? val : [val]
  return arr.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean)
}

function matchName(candidates: string[], value: string): string | undefined {
  const lower = value.toLowerCase()
  const slug = nameToSlug(value)
  return candidates.find(
    (c) => c.toLowerCase() === lower || nameToSlug(c) === slug,
  )
}

export function parseFilters(
  sp: Record<string, string | string[] | undefined>,
  allBrands: string[],
  allRanges: string[],
  itemsByType: Record<string, string[]>,
): FilterState {
  const brands = readMultiParam(sp, 'brand')
    .map((v) => matchName(allBrands, v))
    .filter((v): v is string => !!v)

  const ranges = readMultiParam(sp, 'range')
    .map((v) => matchName(allRanges, v))
    .filter((v): v is string => !!v)

  const tags: Record<string, string[]> = {}
  for (const type of Object.keys(itemsByType)) {
    tags[type] = []
  }

  const needParam = readMultiParam(sp, 'need')
  if (needParam.length > 0 && itemsByType['besoins']) {
    tags['besoins'] = needParam
      .map((v) => matchName(itemsByType['besoins'], v))
      .filter((v): v is string => !!v)
  }

  const tagParam = readMultiParam(sp, 'tag')
  for (const entry of tagParam) {
    const [type, value] = entry.split(':')
    if (!type || !value || !itemsByType[type]) continue
    const matched = matchName(itemsByType[type], value)
    if (matched) {
      tags[type] ??= []
      tags[type].push(matched)
    }
  }

  const q = (typeof sp.q === 'string' ? sp.q : '') .trim()
  const sort = (['bestsellers', 'az', 'za', 'price-asc', 'price-desc'] as SortKey[]).includes(sp.sort as SortKey)
    ? (sp.sort as SortKey)
    : 'bestsellers'
  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1)

  return { brands, ranges, tags, q, sort, page }
}

function matchesFilters(
  p: CatalogueProduct,
  filters: FilterState,
  excludeTagType?: string,
  excludeBrand?: boolean,
  excludeRange?: boolean,
): boolean {
  if (filters.q && !p.name.toLowerCase().includes(filters.q.toLowerCase())) return false
  if (!excludeBrand && filters.brands.length > 0 && !filters.brands.includes(p.brand)) return false
  if (!excludeRange && filters.ranges.length > 0 && !filters.ranges.includes(p.range)) return false
  for (const [tagType, selected] of Object.entries(filters.tags)) {
    if (tagType === excludeTagType || selected.length === 0) continue
    const labels = p.tags.filter((t) => t.category === tagType).map((t) => t.label)
    if (!selected.some((s) => labels.includes(s))) return false
  }
  return true
}

export function filterProducts(
  products: CatalogueProduct[],
  filters: FilterState,
): CatalogueProduct[] {
  const out = products.filter((p) => matchesFilters(p, filters))
  out.sort((a, b) => {
    switch (filters.sort) {
      case 'bestsellers': {
        const aw = a.isFeatured ? 1 : 0
        const bw = b.isFeatured ? 1 : 0
        if (aw !== bw) return bw - aw
        return a.name.localeCompare(b.name)
      }
      case 'az': return a.name.localeCompare(b.name)
      case 'za': return b.name.localeCompare(a.name)
      case 'price-asc': return a.price - b.price
      case 'price-desc': return b.price - a.price
      default: return 0
    }
  })
  return out
}

export function computeFacetedCounts(
  products: CatalogueProduct[],
  filters: FilterState,
  allBrands: string[],
  rangesByBrand: Record<string, string[]>,
  itemsByType: Record<string, string[]>,
): FacetedCounts {
  const counts: FacetedCounts = { brands: {}, ranges: {}, tags: {} }

  for (const brand of allBrands) {
    counts.brands[brand] = products.filter(
      (p) => matchesFilters(p, filters, undefined, true) && p.brand === brand,
    ).length
  }

  for (const ranges of Object.values(rangesByBrand)) {
    for (const range of ranges) {
      counts.ranges[range] = products.filter(
        (p) => matchesFilters(p, filters, undefined, false, true) && p.range === range,
      ).length
    }
  }

  for (const [tagType, tagNames] of Object.entries(itemsByType)) {
    counts.tags[tagType] = {}
    for (const name of tagNames) {
      counts.tags[tagType][name] = products.filter(
        (p) =>
          matchesFilters(p, filters, tagType) &&
          p.tags.some((t) => t.category === tagType && t.label === name),
      ).length
    }
  }

  return counts
}

export function buildCatalogueUrl(
  pathname: string,
  filters: FilterState,
  overrides?: Partial<FilterState>,
): string {
  const f = { ...filters, ...overrides }
  const params = new URLSearchParams()
  if (f.q) params.set('q', f.q)
  if (f.brands.length) params.set('brand', f.brands.join(','))
  if (f.ranges.length) params.set('range', f.ranges.join(','))
  if (f.tags['besoins']?.length) params.set('need', f.tags['besoins'].map(nameToSlug).join(','))
  for (const [type, names] of Object.entries(f.tags)) {
    if (type === 'besoins' || !names.length) continue
    for (const name of names) params.append('tag', `${type}:${nameToSlug(name)}`)
  }
  if (f.sort !== 'bestsellers') params.set('sort', f.sort)
  if (f.page > 1) params.set('page', String(f.page))
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}
