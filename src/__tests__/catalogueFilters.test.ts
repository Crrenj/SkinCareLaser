import { describe, expect, it } from 'vitest'
import {
  parseFilters,
  filterProducts,
  computeFacetedCounts,
  buildCatalogueUrl,
  deriveBrandTreeModel,
  buildSelectionFromModel,
  type BrandTreeModel,
  type CatalogueProduct,
  type FilterState,
} from '@/lib/catalogueFilters'

/**
 * Filet de non-régression des filtres URL du catalogue (G-3a).
 * Fige le comportement ACTUEL de src/lib/catalogueFilters.ts AVANT la
 * réécriture Phase 3 (RPC SQL). Chaque sémantique compte :
 *  - parseFilters : matching nom/slug case+accent-insensible, drop des
 *    valeurs inconnues, multi-valeurs (virgule + param répété), need/tag.
 *  - filterProducts : OR intra-type / AND inter-types, brand/range/q, tris.
 *  - computeFacetedCounts : chaque facette exclut son propre filtre.
 *  - buildCatalogueUrl : round-trip avec parseFilters.
 */

// ---------------------------------------------------------------------------
// Fixtures : ~8 produits, 2 marques (dont une accentuée), 3 ranges,
// 2 types de tags (besoins, types-peau), des produits multi-tags.
// ---------------------------------------------------------------------------

const ALL_BRANDS = ['Avène', 'Babe']
const ALL_RANGES = ['Hydrance', 'Solaire', 'Aloe Vera']

// rangesByBrand pour computeFacetedCounts : la marque accentuée porte 2 ranges.
const RANGES_BY_BRAND: Record<string, string[]> = {
  'Avène': ['Hydrance', 'Solaire'],
  'Babe': ['Aloe Vera'],
}

const ITEMS_BY_TYPE: Record<string, string[]> = {
  besoins: ['Hydratation', 'Protection Solaire', 'Anti-Âge'],
  'types-peau': ['Peau Sèche', 'Peau Grasse'],
}

function makeProduct(p: Partial<CatalogueProduct> & Pick<CatalogueProduct, 'id' | 'name' | 'brand' | 'range'>): CatalogueProduct {
  return {
    slug: p.id,
    price: 100,
    currency: 'DOP',
    isNew: false,
    isFeatured: false,
    volume: null,
    images: [],
    tags: [],
    ...p,
  }
}

function tag(label: string, category: string) {
  return { label, category }
}

const PRODUCTS: CatalogueProduct[] = [
  // Avène / Hydrance
  makeProduct({
    id: 'p1',
    name: 'Hydrance Aqua Gel',
    brand: 'Avène',
    range: 'Hydrance',
    price: 250,
    isFeatured: true,
    tags: [tag('Hydratation', 'besoins'), tag('Peau Sèche', 'types-peau')],
  }),
  makeProduct({
    id: 'p2',
    name: 'Hydrance Riche',
    brand: 'Avène',
    range: 'Hydrance',
    price: 300,
    tags: [tag('Hydratation', 'besoins'), tag('Peau Sèche', 'types-peau')],
  }),
  // Avène / Solaire
  makeProduct({
    id: 'p3',
    name: 'Solaire SPF50',
    brand: 'Avène',
    range: 'Solaire',
    price: 400,
    isFeatured: true,
    tags: [tag('Protection Solaire', 'besoins'), tag('Peau Grasse', 'types-peau')],
  }),
  makeProduct({
    id: 'p4',
    name: 'Solaire Fluide',
    brand: 'Avène',
    range: 'Solaire',
    price: 350,
    tags: [tag('Protection Solaire', 'besoins')],
  }),
  // Babe / Aloe Vera
  makeProduct({
    id: 'p5',
    name: 'Aloe Vera Crema',
    brand: 'Babe',
    range: 'Aloe Vera',
    price: 150,
    isFeatured: true,
    tags: [tag('Hydratation', 'besoins'), tag('Peau Grasse', 'types-peau')],
  }),
  makeProduct({
    id: 'p6',
    name: 'Aloe Vera Gel',
    brand: 'Babe',
    range: 'Aloe Vera',
    price: 120,
    tags: [tag('Hydratation', 'besoins')],
  }),
  makeProduct({
    id: 'p7',
    name: 'Babe Anti-Edad',
    brand: 'Babe',
    range: 'Aloe Vera',
    price: 500,
    tags: [tag('Anti-Âge', 'besoins'), tag('Peau Sèche', 'types-peau')],
  }),
  // Produit sans tag, pour les cas vides
  makeProduct({
    id: 'p8',
    name: 'Babe Neutro',
    brand: 'Babe',
    range: 'Aloe Vera',
    price: 90,
    tags: [],
  }),
]

// helper : état de filtre neutre (toutes les clés de tags initialisées vides)
function emptyFilters(overrides: Partial<FilterState> = {}): FilterState {
  return {
    brands: [],
    ranges: [],
    pairs: {},
    tags: { besoins: [], 'types-peau': [] },
    q: '',
    sort: 'bestsellers',
    page: 1,
    ...overrides,
  }
}

function ids(products: CatalogueProduct[]): string[] {
  return products.map((p) => p.id)
}

// ===========================================================================
// 1. parseFilters — matching nom / slug / multi-valeurs
// ===========================================================================
describe('parseFilters — matching marques & gammes', () => {
  it('matche par nom exact (insensible à la casse)', () => {
    const f = parseFilters({ brand: 'avène' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.brands).toEqual(['Avène'])
  })

  it('matche par slug accent-insensible (« creme-solaire » → « Crème Solaire »)', () => {
    const brands = ['Crème Solaire', 'Babe']
    const f = parseFilters({ brand: 'creme-solaire' }, brands, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.brands).toEqual(['Crème Solaire'])
  })

  it('matche une gamme avec espace via son slug (« aloe-vera » → « Aloe Vera »)', () => {
    const f = parseFilters({ range: 'aloe-vera' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.ranges).toEqual(['Aloe Vera'])
  })

  it('drope silencieusement une valeur inconnue', () => {
    const f = parseFilters({ brand: 'inconnue,Babe' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.brands).toEqual(['Babe'])
  })

  it('lit les multi-valeurs séparées par virgule', () => {
    const f = parseFilters({ brand: 'Avène,Babe' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.brands).toEqual(['Avène', 'Babe'])
  })

  it('lit les multi-valeurs en param répété (array)', () => {
    const f = parseFilters({ brand: ['Avène', 'Babe'] }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.brands).toEqual(['Avène', 'Babe'])
  })

  it('combine virgule + array et trim les espaces', () => {
    const f = parseFilters({ brand: [' Avène ', 'inconnue, Babe'] }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.brands).toEqual(['Avène', 'Babe'])
  })
})

// ===========================================================================
// 2. parseFilters — need / tag
// ===========================================================================
describe('parseFilters — need & tag', () => {
  it('?need=... alimente tags["besoins"] (slug accent-insensible)', () => {
    const f = parseFilters({ need: 'hydratation,anti-age' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.tags['besoins']).toEqual(['Hydratation', 'Anti-Âge'])
  })

  it('?need=... est ignoré si itemsByType n\'a pas la clé "besoins"', () => {
    const noBesoins: Record<string, string[]> = { 'types-peau': ['Peau Sèche'] }
    const f = parseFilters({ need: 'hydratation' }, ALL_BRANDS, ALL_RANGES, noBesoins)
    // pas de clé besoins du tout dans tags
    expect(f.tags['besoins']).toBeUndefined()
  })

  it('?tag=type:slug alimente tags[type]', () => {
    const f = parseFilters({ tag: 'types-peau:peau-seche' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.tags['types-peau']).toEqual(['Peau Sèche'])
  })

  it('?tag accepte plusieurs entrées (param répété)', () => {
    const f = parseFilters(
      { tag: ['types-peau:peau-seche', 'types-peau:peau-grasse'] },
      ALL_BRANDS,
      ALL_RANGES,
      ITEMS_BY_TYPE,
    )
    expect(f.tags['types-peau']).toEqual(['Peau Sèche', 'Peau Grasse'])
  })

  it('ignore un ?tag dont le type est inconnu', () => {
    const f = parseFilters({ tag: 'inconnu:peau-seche' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.tags['inconnu']).toBeUndefined()
    expect(f.tags['types-peau']).toEqual([])
  })

  it('ignore une entrée ?tag sans « : »', () => {
    const f = parseFilters({ tag: 'peau-seche' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.tags['types-peau']).toEqual([])
  })

  it('ignore un ?tag dont la valeur slug ne matche aucun label du type', () => {
    const f = parseFilters({ tag: 'besoins:inexistant' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.tags['besoins']).toEqual([])
  })

  it('initialise toutes les clés de itemsByType à [] même sans param', () => {
    const f = parseFilters({}, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.tags).toEqual({ besoins: [], 'types-peau': [] })
  })
})

// ===========================================================================
// 3. parseFilters — q / sort / page
// ===========================================================================
describe('parseFilters — q, sort, page', () => {
  it('trim la requête q', () => {
    const f = parseFilters({ q: '  serum  ' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.q).toBe('serum')
  })

  it('q array (non-string) est ignoré → chaîne vide', () => {
    const f = parseFilters({ q: ['a', 'b'] }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.q).toBe('')
  })

  it('whiteliste sort, défaut bestsellers', () => {
    expect(parseFilters({ sort: 'az' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE).sort).toBe('az')
    expect(parseFilters({ sort: 'price-desc' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE).sort).toBe('price-desc')
    expect(parseFilters({ sort: 'invalide' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE).sort).toBe('bestsellers')
    expect(parseFilters({}, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE).sort).toBe('bestsellers')
  })

  it('page >= 1, défaut 1, NaN → 1, valeur < 1 → 1', () => {
    expect(parseFilters({ page: '3' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE).page).toBe(3)
    expect(parseFilters({}, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE).page).toBe(1)
    expect(parseFilters({ page: 'abc' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE).page).toBe(1)
    expect(parseFilters({ page: '0' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE).page).toBe(1)
    expect(parseFilters({ page: '-5' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE).page).toBe(1)
  })
})

// ===========================================================================
// 4. filterProducts — sémantique de filtrage
// ===========================================================================
describe('filterProducts — filtrage', () => {
  it('sans filtre, renvoie tous les produits', () => {
    const out = filterProducts(PRODUCTS, emptyFilters())
    expect(out).toHaveLength(PRODUCTS.length)
  })

  it('filtre brand = OR entre marques', () => {
    const onlyAvene = filterProducts(PRODUCTS, emptyFilters({ brands: ['Avène'] }))
    expect(ids(onlyAvene).sort()).toEqual(['p1', 'p2', 'p3', 'p4'])

    const both = filterProducts(PRODUCTS, emptyFilters({ brands: ['Avène', 'Babe'] }))
    expect(both).toHaveLength(PRODUCTS.length)
  })

  it('filtre range', () => {
    const solaire = filterProducts(PRODUCTS, emptyFilters({ ranges: ['Solaire'] }))
    expect(ids(solaire).sort()).toEqual(['p3', 'p4'])
  })

  it('OR intra-type : deux besoins sélectionnés → union', () => {
    const out = filterProducts(
      PRODUCTS,
      emptyFilters({ tags: { besoins: ['Protection Solaire', 'Anti-Âge'], 'types-peau': [] } }),
    )
    // p3, p4 (solaire) + p7 (anti-âge)
    expect(ids(out).sort()).toEqual(['p3', 'p4', 'p7'])
  })

  it('AND inter-types : besoins ET types-peau doivent tous deux matcher', () => {
    const out = filterProducts(
      PRODUCTS,
      emptyFilters({ tags: { besoins: ['Hydratation'], 'types-peau': ['Peau Sèche'] } }),
    )
    // Hydratation : p1, p2, p5, p6 ; Peau Sèche : p1, p2, p7 → intersection p1, p2
    expect(ids(out).sort()).toEqual(['p1', 'p2'])
  })

  it('q = substring insensible à la casse sur name', () => {
    const out = filterProducts(PRODUCTS, emptyFilters({ q: 'aloe' }))
    expect(ids(out).sort()).toEqual(['p5', 'p6'])

    const upper = filterProducts(PRODUCTS, emptyFilters({ q: 'SOLAIRE' }))
    expect(ids(upper).sort()).toEqual(['p3', 'p4'])
  })

  it('combine brand + tag + q', () => {
    const out = filterProducts(
      PRODUCTS,
      emptyFilters({
        brands: ['Avène'],
        tags: { besoins: ['Hydratation'], 'types-peau': [] },
        q: 'riche',
      }),
    )
    expect(ids(out)).toEqual(['p2'])
  })
})

// ===========================================================================
// 5. filterProducts — tris
// ===========================================================================
describe('filterProducts — tris', () => {
  it('bestsellers : isFeatured d\'abord, puis alphabétique', () => {
    const out = filterProducts(PRODUCTS, emptyFilters({ sort: 'bestsellers' }))
    // featured = p1 (Hydrance Aqua Gel), p3 (Solaire SPF50), p5 (Aloe Vera Crema)
    // triés alpha entre eux : Aloe Vera Crema, Hydrance Aqua Gel, Solaire SPF50
    expect(ids(out).slice(0, 3)).toEqual(['p5', 'p1', 'p3'])
    // le reste alpha : Aloe Vera Gel, Babe Anti-Edad, Babe Neutro, Hydrance Riche, Solaire Fluide
    expect(ids(out).slice(3)).toEqual(['p6', 'p7', 'p8', 'p2', 'p4'])
  })

  it('az : alphabétique croissant sur name', () => {
    const out = filterProducts(PRODUCTS, emptyFilters({ sort: 'az' }))
    expect(out.map((p) => p.name)).toEqual([
      'Aloe Vera Crema',
      'Aloe Vera Gel',
      'Babe Anti-Edad',
      'Babe Neutro',
      'Hydrance Aqua Gel',
      'Hydrance Riche',
      'Solaire Fluide',
      'Solaire SPF50',
    ])
  })

  it('za : alphabétique décroissant sur name', () => {
    const out = filterProducts(PRODUCTS, emptyFilters({ sort: 'za' }))
    expect(out.map((p) => p.name)[0]).toBe('Solaire SPF50')
    expect(out.map((p) => p.name).at(-1)).toBe('Aloe Vera Crema')
  })

  it('price-asc : prix croissant', () => {
    const out = filterProducts(PRODUCTS, emptyFilters({ sort: 'price-asc' }))
    expect(out.map((p) => p.price)).toEqual([90, 120, 150, 250, 300, 350, 400, 500])
  })

  it('price-desc : prix décroissant', () => {
    const out = filterProducts(PRODUCTS, emptyFilters({ sort: 'price-desc' }))
    expect(out.map((p) => p.price)).toEqual([500, 400, 350, 300, 250, 150, 120, 90])
  })
})

// ===========================================================================
// 6. computeFacetedCounts — chaque facette exclut son propre filtre
// ===========================================================================
describe('computeFacetedCounts — exclusion du filtre propre', () => {
  it('le compteur de marque est calculé SANS le filtre brand', () => {
    // Avec un filtre brand=Avène, on doit quand même voir le compteur de Babe.
    const filters = emptyFilters({ brands: ['Avène'] })
    const counts = computeFacetedCounts(PRODUCTS, filters, ALL_BRANDS, RANGES_BY_BRAND, ITEMS_BY_TYPE)
    expect(counts.brands['Avène']).toBe(4) // p1..p4
    expect(counts.brands['Babe']).toBe(4) // p5..p8 — non éteint par le filtre Avène
  })

  it('le compteur de range est calculé SANS le filtre range', () => {
    const filters = emptyFilters({ ranges: ['Solaire'] })
    const counts = computeFacetedCounts(PRODUCTS, filters, ALL_BRANDS, RANGES_BY_BRAND, ITEMS_BY_TYPE)
    // malgré le filtre Solaire, Hydrance et Aloe Vera restent comptés
    expect(counts.ranges['Solaire']).toBe(2)
    expect(counts.ranges['Hydrance']).toBe(2)
    expect(counts.ranges['Aloe Vera']).toBe(4)
  })

  it('le compteur d\'un type de tag exclut le filtre de CE type mais applique les AUTRES', () => {
    // Filtre : besoins=Hydratation  +  types-peau=Peau Sèche.
    // Compteur de "besoins" → exclut le filtre besoins, garde le filtre types-peau=Peau Sèche.
    //   Peau Sèche = p1, p2, p7. Parmi eux : Hydratation(p1,p2)=2, Anti-Âge(p7)=1, Protection Solaire=0.
    // Compteur de "types-peau" → exclut le filtre types-peau, garde besoins=Hydratation.
    //   Hydratation = p1, p2, p5, p6. Parmi eux : Peau Sèche(p1,p2)=2, Peau Grasse(p5)=1.
    const filters = emptyFilters({
      tags: { besoins: ['Hydratation'], 'types-peau': ['Peau Sèche'] },
    })
    const counts = computeFacetedCounts(PRODUCTS, filters, ALL_BRANDS, RANGES_BY_BRAND, ITEMS_BY_TYPE)

    expect(counts.tags['besoins']['Hydratation']).toBe(2)
    expect(counts.tags['besoins']['Anti-Âge']).toBe(1)
    expect(counts.tags['besoins']['Protection Solaire']).toBe(0)

    expect(counts.tags['types-peau']['Peau Sèche']).toBe(2)
    expect(counts.tags['types-peau']['Peau Grasse']).toBe(1)
  })

  it('le compteur de marque applique tout de même les filtres tag', () => {
    // Filtre tag besoins=Protection Solaire → seulement p3, p4 (toutes deux Avène).
    const filters = emptyFilters({ tags: { besoins: ['Protection Solaire'], 'types-peau': [] } })
    const counts = computeFacetedCounts(PRODUCTS, filters, ALL_BRANDS, RANGES_BY_BRAND, ITEMS_BY_TYPE)
    expect(counts.brands['Avène']).toBe(2)
    expect(counts.brands['Babe']).toBe(0)
  })
})

// ===========================================================================
// 7. buildCatalogueUrl — round-trip avec parseFilters
// ===========================================================================
describe('buildCatalogueUrl — round-trip', () => {
  // Transforme l'URL produite en Record compatible parseFilters (tag répété → array).
  function urlToSearchParams(url: string): Record<string, string | string[] | undefined> {
    const qs = url.includes('?') ? url.slice(url.indexOf('?') + 1) : ''
    const sp = new URLSearchParams(qs)
    const out: Record<string, string | string[] | undefined> = {}
    for (const key of new Set(sp.keys())) {
      const all = sp.getAll(key)
      out[key] = all.length > 1 ? all : all[0]
    }
    return out
  }

  function roundTrip(state: FilterState): FilterState {
    const url = buildCatalogueUrl('/fr/catalogue', state)
    return parseFilters(urlToSearchParams(url), ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE, RANGES_BY_BRAND)
  }

  it('marques accentuées', () => {
    const state = emptyFilters({ brands: ['Avène', 'Babe'] })
    expect(roundTrip(state)).toEqual(state)
  })

  it('range', () => {
    const state = emptyFilters({ ranges: ['Aloe Vera'] })
    expect(roundTrip(state)).toEqual(state)
  })

  it('besoins (via param need) + types-peau (via param tag) — multi-tags', () => {
    const state = emptyFilters({
      tags: { besoins: ['Hydratation', 'Anti-Âge'], 'types-peau': ['Peau Sèche'] },
    })
    expect(roundTrip(state)).toEqual(state)
  })

  it('sort non-défaut + page > 1 + q', () => {
    const state = emptyFilters({ sort: 'price-desc', page: 3, q: 'serum' })
    expect(roundTrip(state)).toEqual(state)
  })

  it('état combiné représentatif', () => {
    const state = emptyFilters({
      brands: ['Avène'],
      ranges: ['Hydrance'],
      tags: { besoins: ['Hydratation'], 'types-peau': ['Peau Sèche', 'Peau Grasse'] },
      q: 'gel',
      sort: 'az',
      page: 2,
    })
    expect(roundTrip(state)).toEqual(state)
  })
})

// ===========================================================================
// 8. buildCatalogueUrl — omission des valeurs par défaut/vides
// ===========================================================================
describe('buildCatalogueUrl — omission des champs vides/par défaut', () => {
  it('un état neutre produit l\'URL sans query string', () => {
    expect(buildCatalogueUrl('/fr/catalogue', emptyFilters())).toBe('/fr/catalogue')
  })

  it('sort=bestsellers et page=1 sont omis', () => {
    const url = buildCatalogueUrl('/fr/catalogue', emptyFilters({ sort: 'bestsellers', page: 1 }))
    expect(url).toBe('/fr/catalogue')
  })

  it('page > 1 et sort non-défaut apparaissent', () => {
    const url = buildCatalogueUrl('/fr/catalogue', emptyFilters({ sort: 'az', page: 2 }))
    expect(url).toContain('sort=az')
    expect(url).toContain('page=2')
  })

  it('q vide est omis', () => {
    const url = buildCatalogueUrl('/fr/catalogue', emptyFilters({ q: '' }))
    expect(url).not.toContain('q=')
  })

  it('besoins → param need (slugifié), types-peau → param tag (slugifié)', () => {
    const url = buildCatalogueUrl(
      '/fr/catalogue',
      emptyFilters({ tags: { besoins: ['Protection Solaire'], 'types-peau': ['Peau Sèche'] } }),
    )
    const sp = new URLSearchParams(url.slice(url.indexOf('?') + 1))
    expect(sp.get('need')).toBe('protection-solaire')
    expect(sp.getAll('tag')).toEqual(['types-peau:peau-seche'])
  })

  it('un type de tag sans sélection n\'écrit aucun param tag', () => {
    const url = buildCatalogueUrl(
      '/fr/catalogue',
      emptyFilters({ tags: { besoins: [], 'types-peau': [] } }),
    )
    expect(url).toBe('/fr/catalogue')
  })

  it('overrides est appliqué par-dessus l\'état', () => {
    const url = buildCatalogueUrl('/fr/catalogue', emptyFilters({ page: 5 }), { page: 1 })
    expect(url).toBe('/fr/catalogue')
  })
})

// ===========================================================================
// 9. Paires marque:gamme (arbre Marque → Gammes, redesign 2026-06-11)
// ===========================================================================

// Fixture avec COLLISION de nom : « Solar » existe chez Avène ET Babe.
// (Cas réel en prod : « Protectores Solares » Avène+Babe, « Général »
// Filorga+Levissime.) C'est ce qui impose les paires qualifiées.
const COLLIDING_RANGES_BY_BRAND: Record<string, string[]> = {
  'Avène': ['Hydrance', 'Solar'],
  'Babe': ['Aloe Vera', 'Solar'],
}
const COLLIDING_ALL_RANGES = ['Hydrance', 'Solar', 'Aloe Vera']

const COLLIDING_PRODUCTS: CatalogueProduct[] = [
  makeProduct({ id: 'a1', name: 'Avène Hydrance Gel', brand: 'Avène', range: 'Hydrance' }),
  makeProduct({ id: 'a2', name: 'Avène Solar SPF50', brand: 'Avène', range: 'Solar' }),
  makeProduct({ id: 'b1', name: 'Babe Aloe Crema', brand: 'Babe', range: 'Aloe Vera' }),
  makeProduct({ id: 'b2', name: 'Babe Solar Pediatric', brand: 'Babe', range: 'Solar' }),
]

describe('parseFilters — entrées range qualifiées (marque:gamme)', () => {
  it('résout une paire qualifiée par slugs', () => {
    const f = parseFilters({ range: 'avene:hydrance' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE, RANGES_BY_BRAND)
    expect(f.pairs).toEqual({ 'Avène': ['Hydrance'] })
    expect(f.ranges).toEqual([])
  })

  it('mélange entrées nues et qualifiées dans le même param', () => {
    const f = parseFilters(
      { range: 'solaire,babe:aloe-vera' },
      ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE, RANGES_BY_BRAND,
    )
    expect(f.ranges).toEqual(['Solaire'])
    expect(f.pairs).toEqual({ 'Babe': ['Aloe Vera'] })
  })

  it('droppe une paire dont la marque ou la gamme est inconnue', () => {
    const f = parseFilters(
      { range: 'inconnue:hydrance,avene:inconnue' },
      ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE, RANGES_BY_BRAND,
    )
    expect(f.pairs).toEqual({})
  })

  it('droppe la gamme qualifiée appartenant à une AUTRE marque', () => {
    // Aloe Vera est chez Babe, pas chez Avène.
    const f = parseFilters({ range: 'avene:aloe-vera' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE, RANGES_BY_BRAND)
    expect(f.pairs).toEqual({})
  })

  it('sans rangesByBrand (signature historique), les paires sont droppées', () => {
    const f = parseFilters({ range: 'avene:hydrance' }, ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE)
    expect(f.pairs).toEqual({})
    expect(f.ranges).toEqual([])
  })

  it('déduplique une paire répétée', () => {
    const f = parseFilters(
      { range: 'avene:hydrance,avene:hydrance' },
      ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE, RANGES_BY_BRAND,
    )
    expect(f.pairs).toEqual({ 'Avène': ['Hydrance'] })
  })
})

describe('filterProducts — mode arbre (pairs ⇒ union du groupe marque·gamme)', () => {
  it('paires seules : seuls les produits de la paire exacte matchent (pas de fuite par nom)', () => {
    const out = filterProducts(
      COLLIDING_PRODUCTS,
      emptyFilters({ pairs: { 'Babe': ['Solar'] } }),
    )
    // « Solar » existe aussi chez Avène — la paire ne doit PAS le ramener.
    expect(ids(out)).toEqual(['b2'])
  })

  it('marque pleine + paire d\'une autre marque = UNION (et pas AND vide)', () => {
    const out = filterProducts(
      COLLIDING_PRODUCTS,
      emptyFilters({ brands: ['Avène'], pairs: { 'Babe': ['Aloe Vera'] } }),
    )
    expect(ids(out).sort()).toEqual(['a1', 'a2', 'b1'])
  })

  it('marque pleine + paire : pas de fuite des gammes homonymes de la marque pleine', () => {
    // Avène pleine inclut son « Solar » ; la sélection partielle Babe se
    // limite à Aloe Vera → Babe/Solar (b2) ne doit PAS apparaître.
    const out = filterProducts(
      COLLIDING_PRODUCTS,
      emptyFilters({ brands: ['Avène'], pairs: { 'Babe': ['Aloe Vera'] } }),
    )
    expect(ids(out)).not.toContain('b2')
  })

  it('sans paire, la sémantique héritée AND est inchangée', () => {
    const out = filterProducts(
      COLLIDING_PRODUCTS,
      emptyFilters({ brands: ['Avène'], ranges: ['Aloe Vera'] }),
    )
    expect(out).toHaveLength(0)
  })

  it('gammes nues héritées restent des termes OR en mode arbre', () => {
    const out = filterProducts(
      COLLIDING_PRODUCTS,
      emptyFilters({ ranges: ['Hydrance'], pairs: { 'Babe': ['Aloe Vera'] } }),
    )
    expect(ids(out).sort()).toEqual(['a1', 'b1'])
  })
})

describe('deriveBrandTreeModel / buildSelectionFromModel', () => {
  it('marque de selectedBrands sans gamme cochée → full', () => {
    const m = deriveBrandTreeModel(['Avène'], [], {}, RANGES_BY_BRAND)
    expect(m).toEqual({ 'Avène': 'full' })
  })

  it('sous-ensemble == toutes les gammes → promu full', () => {
    const m = deriveBrandTreeModel([], [], { 'Avène': ['Hydrance', 'Solaire'] }, RANGES_BY_BRAND)
    expect(m).toEqual({ 'Avène': 'full' })
  })

  it('le sous-ensemble gagne sur selectedBrands (deep-link ?brand=X&range=Y)', () => {
    const m = deriveBrandTreeModel(['Avène'], ['Hydrance'], {}, RANGES_BY_BRAND)
    expect(m).toEqual({ 'Avène': ['Hydrance'] })
  })

  it('une gamme NUE ambiguë est attribuée à toutes les marques qui la portent', () => {
    const m = deriveBrandTreeModel([], ['Solar'], {}, COLLIDING_RANGES_BY_BRAND)
    expect(m).toEqual({ 'Avène': ['Solar'], 'Babe': ['Solar'] })
  })

  it('une paire qualifiée ne touche QUE sa marque (pas la marque homonyme)', () => {
    const m = deriveBrandTreeModel([], [], { 'Babe': ['Solar'] }, COLLIDING_RANGES_BY_BRAND)
    expect(m).toEqual({ 'Babe': ['Solar'] })
  })

  it('une marque inconnue de selectedBrands est ignorée', () => {
    const m = deriveBrandTreeModel(['Fantôme'], [], {}, RANGES_BY_BRAND)
    expect(m).toEqual({})
  })

  it('buildSelectionFromModel : fulls → brands, partiels → pairs, ranges toujours []', () => {
    const model: BrandTreeModel = { 'Avène': 'full', 'Babe': ['Aloe Vera'] }
    expect(buildSelectionFromModel(model)).toEqual({
      brands: ['Avène'],
      ranges: [],
      pairs: { 'Babe': ['Aloe Vera'] },
    })
  })

  it('point fixe : derive(build(model)) == model, y compris avec collision de nom', () => {
    const model: BrandTreeModel = { 'Avène': 'full', 'Babe': ['Solar'] }
    const sel = buildSelectionFromModel(model)
    const rederived = deriveBrandTreeModel(sel.brands, sel.ranges, sel.pairs, COLLIDING_RANGES_BY_BRAND)
    expect(rederived).toEqual(model)
  })

  it('point fixe via URL : build → buildCatalogueUrl → parseFilters → derive', () => {
    const model: BrandTreeModel = { 'Avène': 'full', 'Babe': ['Solar'] }
    const sel = buildSelectionFromModel(model)
    const url = buildCatalogueUrl('/fr/catalogue', emptyFilters({ ...sel }))
    const sp = new URLSearchParams(url.slice(url.indexOf('?') + 1))
    const parsed = parseFilters(
      Object.fromEntries(sp.entries()),
      Object.keys(COLLIDING_RANGES_BY_BRAND),
      COLLIDING_ALL_RANGES,
      ITEMS_BY_TYPE,
      COLLIDING_RANGES_BY_BRAND,
    )
    const rederived = deriveBrandTreeModel(parsed.brands, parsed.ranges, parsed.pairs, COLLIDING_RANGES_BY_BRAND)
    expect(rederived).toEqual(model)
  })
})

describe('computeFacetedCounts — le groupe marque·gamme exclut le groupe ENTIER', () => {
  it('compteur de marque : ignore le filtre range (groupe OR)', () => {
    const filters = emptyFilters({ brands: ['Avène'], ranges: ['Hydrance'] })
    const counts = computeFacetedCounts(PRODUCTS, filters, ALL_BRANDS, RANGES_BY_BRAND, ITEMS_BY_TYPE)
    // Avant (facette croisée) Babe serait 0 ; en groupe OR il garde 4.
    expect(counts.brands['Babe']).toBe(4)
  })

  it('compteur de gamme : ignore le filtre brand (groupe OR)', () => {
    const filters = emptyFilters({ brands: ['Avène'] })
    const counts = computeFacetedCounts(PRODUCTS, filters, ALL_BRANDS, RANGES_BY_BRAND, ITEMS_BY_TYPE)
    // La gamme d'une AUTRE marque doit montrer son vrai compteur (pas 0)
    // pour que l'arbre soit explorable sous une marque non cochée.
    expect(counts.ranges['Aloe Vera']).toBe(4)
  })

  it('compteur de gamme : ignore aussi les paires', () => {
    const filters = emptyFilters({ pairs: { 'Avène': ['Hydrance'] } })
    const counts = computeFacetedCounts(PRODUCTS, filters, ALL_BRANDS, RANGES_BY_BRAND, ITEMS_BY_TYPE)
    expect(counts.ranges['Solaire']).toBe(2)
    expect(counts.ranges['Aloe Vera']).toBe(4)
  })

  it('compteurs de tags : appliquent le groupe marque·gamme (union)', () => {
    const filters = emptyFilters({ brands: ['Avène'], pairs: { 'Babe': ['Aloe Vera'] } })
    const counts = computeFacetedCounts(PRODUCTS, filters, ALL_BRANDS, RANGES_BY_BRAND, ITEMS_BY_TYPE)
    // Union = p1..p4 (Avène) + p5..p8 (Babe/Aloe Vera) = tous les produits.
    // Hydratation porte sur p1, p2, p5, p6 → 4.
    expect(counts.tags['besoins']['Hydratation']).toBe(4)
  })
})

describe('buildCatalogueUrl — round-trip des paires', () => {
  it('les paires s\'écrivent en marque-slug:gamme-slug et se relisent', () => {
    const state = emptyFilters({ brands: ['Babe'], pairs: { 'Avène': ['Hydrance'] } })
    const url = buildCatalogueUrl('/fr/catalogue', state)
    expect(url).toContain('range=avene%3Ahydrance')
    const sp = new URLSearchParams(url.slice(url.indexOf('?') + 1))
    const parsed = parseFilters(
      Object.fromEntries(sp.entries()),
      ALL_BRANDS, ALL_RANGES, ITEMS_BY_TYPE, RANGES_BY_BRAND,
    )
    expect(parsed.brands).toEqual(['Babe'])
    expect(parsed.pairs).toEqual({ 'Avène': ['Hydrance'] })
  })
})
