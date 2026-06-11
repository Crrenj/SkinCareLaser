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
  /**
   * Sélections de gammes QUALIFIÉES par marque : { marque: [gammes] }.
   * Encodées dans le param `range` en `marque-slug:gamme-slug` (même motif
   * que `tag=type:slug`). Les noms de gammes ne sont PAS uniques entre
   * marques (ex. « Protectores Solares » chez Avène ET Babe) — la paire
   * lève l'ambiguïté que `ranges` (noms nus, hérité des deep-links) ne peut
   * pas exprimer. Quand `pairs` est non vide, le groupe marque·gamme passe
   * en sémantique UNION : marque cochée OU paire cochée (cf. RPC).
   */
  pairs: Record<string, string[]>
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
  rangesByBrand?: Record<string, string[]>,
): FilterState {
  const brands = readMultiParam(sp, 'brand')
    .map((v) => matchName(allBrands, v))
    .filter((v): v is string => !!v)

  // `range` accepte deux formes d'entrée :
  //  - nue (`hydrance`, nom ou slug) → ranges, sémantique héritée ;
  //  - qualifiée (`avene:hydrance`) → pairs, résolue contre rangesByBrand.
  // Une entrée qualifiée irrésoluble (marque/gamme inconnue, ou
  // rangesByBrand absent) est droppée silencieusement, comme les nues.
  const ranges: string[] = []
  const pairs: Record<string, string[]> = {}
  for (const entry of readMultiParam(sp, 'range')) {
    const sep = entry.indexOf(':')
    if (sep === -1) {
      const matched = matchName(allRanges, entry)
      if (matched) ranges.push(matched)
      continue
    }
    if (!rangesByBrand) continue
    const brand = matchName(Object.keys(rangesByBrand), entry.slice(0, sep))
    if (!brand) continue
    const range = matchName(rangesByBrand[brand] ?? [], entry.slice(sep + 1))
    if (!range) continue
    pairs[brand] ??= []
    if (!pairs[brand].includes(range)) pairs[brand].push(range)
  }

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

  return { brands, ranges, pairs, tags, q, sort, page }
}

// ---------------------------------------------------------------------------
// Arbre Marque → Gammes (rail catalogue, redesign v2)
// ---------------------------------------------------------------------------

/**
 * Modèle de sélection de l'arbre : par marque, soit `'full'` (la marque
 * entière est cochée), soit le sous-ensemble NON VIDE de ses gammes cochées.
 * Une marque absente du modèle n'a rien de coché.
 */
export type BrandTreeModel = Record<string, 'full' | string[]>

/**
 * Dérive le modèle d'arbre depuis l'état URL parsé.
 * Règles :
 *  - les paires qualifiées et les gammes nues (attribuées à TOUTES les
 *    marques qui portent ce nom — un nom nu est intrinsèquement ambigu)
 *    forment le sous-ensemble coché d'une marque ;
 *  - sous-ensemble == toutes les gammes de la marque → promu `'full'` ;
 *  - une marque de `selectedBrands` sans gamme cochée → `'full'` ;
 *  - une marque de `selectedBrands` AVEC un sous-ensemble → le sous-ensemble
 *    gagne (préserve la sémantique AND des deep-links `?brand=X&range=Y`).
 * Itère dans l'ordre des clés de rangesByBrand (stable, alphabétique).
 */
export function deriveBrandTreeModel(
  selectedBrands: string[],
  selectedRanges: string[],
  pairs: Record<string, string[]>,
  rangesByBrand: Record<string, string[]>,
): BrandTreeModel {
  const model: BrandTreeModel = {}
  for (const [brand, allRanges] of Object.entries(rangesByBrand)) {
    const subset = allRanges.filter(
      (r) => selectedRanges.includes(r) || (pairs[brand] ?? []).includes(r),
    )
    if (subset.length === 0) continue
    model[brand] = subset.length === allRanges.length ? 'full' : subset
  }
  for (const brand of selectedBrands) {
    if (!(brand in model) && brand in rangesByBrand) model[brand] = 'full'
  }
  return model
}

/**
 * Reconstruit la sélection canonique depuis le modèle :
 *  - brands = marques `'full'` uniquement ;
 *  - pairs  = sous-ensembles partiels, qualifiés par marque ;
 *  - ranges = [] TOUJOURS (jamais d'expansion en noms nus — c'est ce qui
 *    évite les fuites entre marques partageant un nom de gamme).
 * build(derive(x)) est un point fixe pour toute URL produite par l'UI.
 */
export function buildSelectionFromModel(model: BrandTreeModel): {
  brands: string[]
  ranges: string[]
  pairs: Record<string, string[]>
} {
  const brands: string[] = []
  const pairs: Record<string, string[]> = {}
  for (const [brand, value] of Object.entries(model)) {
    if (value === 'full') brands.push(brand)
    else if (value.length > 0) pairs[brand] = value
  }
  return { brands, ranges: [], pairs }
}

/**
 * ⚠️ matchesFilters / filterProducts / computeFacetedCounts ne sont PLUS
 * appelés par l'app (le filtrage runtime vit dans la RPC `get_catalogue_page`,
 * migration 20260611235000). Ils restent comme SPEC EXÉCUTABLE de la RPC,
 * exercée par catalogueFilters.test.ts — toute évolution de la sémantique SQL
 * (mode arbre/paires, facettes de groupe) doit être répliquée ici et testée.
 */
function matchesFilters(
  p: CatalogueProduct,
  filters: FilterState,
  excludeTagType?: string,
  excludeBrandRangeGroup?: boolean,
): boolean {
  if (filters.q && !p.name.toLowerCase().includes(filters.q.toLowerCase())) return false
  if (!excludeBrandRangeGroup) {
    const pairs = filters.pairs ?? {}
    const hasPairs = Object.values(pairs).some((a) => a.length > 0)
    if (hasPairs) {
      // Mode arbre : le groupe marque·gamme est une UNION — marque cochée
      // en entier OU paire (marque, gamme) cochée OU gamme nue héritée.
      const ok =
        filters.brands.includes(p.brand) ||
        (filters.ranges.length > 0 && filters.ranges.includes(p.range)) ||
        (pairs[p.brand] ?? []).includes(p.range)
      if (!ok) return false
    } else {
      // Mode hérité (aucune paire) : AND entre familles, inchangé.
      if (filters.brands.length > 0 && !filters.brands.includes(p.brand)) return false
      if (filters.ranges.length > 0 && !filters.ranges.includes(p.range)) return false
    }
  }
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

  // L'arbre fait du groupe marque·gamme UN seul groupe à sémantique OR →
  // ses deux facettes excluent le groupe ENTIER (marques + gammes + paires)
  // et n'appliquent que les autres familles (tags, q).
  for (const brand of allBrands) {
    counts.brands[brand] = products.filter(
      (p) => matchesFilters(p, filters, undefined, true) && p.brand === brand,
    ).length
  }

  for (const ranges of Object.values(rangesByBrand)) {
    for (const range of ranges) {
      counts.ranges[range] = products.filter(
        (p) => matchesFilters(p, filters, undefined, true) && p.range === range,
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
  // Gammes : entrées nues héritées (noms) + paires qualifiées en
  // `marque-slug:gamme-slug`, dans le même param `range`.
  const rangeEntries = [
    ...f.ranges,
    ...Object.entries(f.pairs ?? {}).flatMap(([brand, ranges]) =>
      ranges.map((r) => `${nameToSlug(brand)}:${nameToSlug(r)}`),
    ),
  ]
  if (rangeEntries.length) params.set('range', rangeEntries.join(','))
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
