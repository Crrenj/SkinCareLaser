'use client'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import ProductCard from '@/components/ProductCard'
import Filters from '@/components/Filters'
import { FiltersMobileSheet } from '@/components/catalogue/FiltersMobileSheet'
import { FiltersPill, type ActiveFilterPill } from '@/components/catalogue/FiltersPill'

/**
 * Génère la séquence de pages à afficher pour une pagination ellipsis :
 *   `‹ 1 [2] 3 … 19 ›` au lieu des 20 boutons à plat.
 * `siblings` = combien de pages on garde autour de la page active (par défaut 1).
 * Compact : on n'insère jamais 2 ellipses consécutives ni une ellipse qui
 * cache une seule page (on affiche cette page à la place).
 */
function buildPageRange(
  current: number,
  total: number,
  siblings = 1,
): Array<number | 'ellipsis'> {
  // Petit total : tout afficher
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const first = 1
  const last = total
  const start = Math.max(first + 1, current - siblings)
  const end = Math.min(last - 1, current + siblings)

  const out: Array<number | 'ellipsis'> = [first]
  if (start > first + 1) out.push('ellipsis')
  else if (start === first + 1) out.push(first + 1)
  for (let i = Math.max(start, first + 2); i <= end; i++) out.push(i)
  if (end < last - 1) out.push('ellipsis')
  else if (end === last - 1) out.push(last - 1)
  out.push(last)
  return out
}

/**
 * Convertit un name de tag/marque en slug kebab-case sans accents, pour
 * matcher les params URL comme `?need=protection-solaire` ou `?brand=avene`.
 */
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Split tolérant : accepte `?brand=A,B` ou `?brand=A&brand=B`. */
function readMultiParam(params: URLSearchParams, key: string): string[] {
  const all = params.getAll(key)
  if (all.length === 0) return []
  return all.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean)
}

interface TagItem { label: string; category: string }
interface Product {
  id: string
  slug: string
  name: string
  price: number
  currency: string
  images: { url: string; alt: string | null }[]
  brand?: string
  range?: string
  tags?: TagItem[]
}
interface CatalogueClientProps {
  products: Product[]
  itemsByType: Record<string, string[]>
}

export default function CatalogueClient({
  products,
  itemsByType,
}: CatalogueClientProps) {
  const t = useTranslations('Catalogue')
  // Reprend ?q= depuis l'URL (arrivée depuis NavSearch) pour pré-remplir le champ.
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  // États pour la recherche et le tri
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [sortBy, setSortBy] = useState('bestsellers')

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 18 // 3 produits par ligne × 6 lignes

  // Si l'utilisateur navigue d'un /catalogue à un autre /catalogue?q=… via NavSearch
  // sans re-mount, on resync le champ depuis l'URL.
  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    setSearchTerm(q)
    setCurrentPage(1)
  }, [searchParams])

  // listes dynamiques
  const brands = useMemo(
    () =>
      Array.from(
        new Set(products.map(p => p.brand).filter((b): b is string => !!b))
      ).sort(),
    [products]
  )

  // Grouper les gammes par marque
  const rangesByBrand = useMemo(() => {
    const grouped: Record<string, string[]> = {}
    products.forEach(p => {
      if (p.brand && p.range) {
        if (!grouped[p.brand]) {
          grouped[p.brand] = []
        }
        if (!grouped[p.brand].includes(p.range)) {
          grouped[p.brand].push(p.range)
        }
      }
    })
    // Trier les gammes dans chaque marque
    Object.keys(grouped).forEach(brand => {
      grouped[brand].sort()
    })
    return grouped
  }, [products])

  // États des filtres dynamiques basés sur itemsByType
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  const [selectedRanges, setSelectedRanges] = useState<Set<string>>(new Set())
  const [selectedTags, setSelectedTags] = useState<Record<string, Set<string>>>(
    () =>
      Object.fromEntries(
        Object.keys(itemsByType).map(key => [key, new Set<string>()])
      )
  )

  // Sync filtres ↔ URL : lis ?brand, ?range, ?need, ?tag au mount (et à chaque
  // navigation). Permet aux liens "Voir SPF" / "Hydratation" / brand badge PDP
  // d'arriver pré-filtrés.
  useEffect(() => {
    // brand/range = matching par nom exact (case-insensitive ou via slug)
    const brandsParam = readMultiParam(searchParams, 'brand')
    const matchedBrands = new Set<string>()
    brandsParam.forEach((value) => {
      const lower = value.toLowerCase()
      const slug = nameToSlug(value)
      const match = brands.find(
        (b) => b.toLowerCase() === lower || nameToSlug(b) === slug,
      )
      if (match) matchedBrands.add(match)
    })

    const rangesParam = readMultiParam(searchParams, 'range')
    const allRanges = Object.values(rangesByBrand).flat()
    const matchedRanges = new Set<string>()
    rangesParam.forEach((value) => {
      const lower = value.toLowerCase()
      const slug = nameToSlug(value)
      const match = allRanges.find(
        (r) => r.toLowerCase() === lower || nameToSlug(r) === slug,
      )
      if (match) matchedRanges.add(match)
    })

    // need/tag = matching par slug contre les noms de tags de chaque tag_type
    const nextTags: Record<string, Set<string>> = Object.fromEntries(
      Object.keys(itemsByType).map((k) => [k, new Set<string>()]),
    )

    // ?need=slug → tag_type 'besoins'
    const needParam = readMultiParam(searchParams, 'need')
    if (needParam.length > 0 && itemsByType['besoins']) {
      needParam.forEach((slug) => {
        const wanted = slug.toLowerCase()
        const match = itemsByType['besoins'].find(
          (name) => nameToSlug(name) === wanted || name.toLowerCase() === wanted,
        )
        if (match) nextTags['besoins'].add(match)
      })
    }

    // ?tag=type:slug → générique, supporte tous les tag_types
    // Ex: ?tag=ingredients:vitamine-c ou ?tag=types-peau:sensible
    const tagParam = readMultiParam(searchParams, 'tag')
    tagParam.forEach((entry) => {
      const [type, value] = entry.split(':')
      if (!type || !value || !itemsByType[type]) return
      const wanted = value.toLowerCase()
      const match = itemsByType[type].find(
        (name) => nameToSlug(name) === wanted || name.toLowerCase() === wanted,
      )
      if (match) nextTags[type].add(match)
    })

    setSelectedBrands(matchedBrands)
    setSelectedRanges(matchedRanges)
    setSelectedTags(nextTags)
    setCurrentPage(1)
  }, [searchParams, brands, rangesByBrand, itemsByType])

  const handleTagToggle = useCallback((tagType: string, tagName: string) => {
    setSelectedTags(prev => {
      const s = new Set(prev[tagType])
      if (s.has(tagName)) {
        s.delete(tagName)
      } else {
        s.add(tagName)
      }
      return { ...prev, [tagType]: s }
    })
    setCurrentPage(1)
  }, [])

  // ─── Filtres mobile : sheet + pilule ───
  const [sheetOpen, setSheetOpen] = useState(false)

  // Handler pour toggle une marque
  const handleBrandToggle = useCallback((brand: string) => {
    setSelectedBrands(prev => {
      const newBrands = new Set(prev)
      if (newBrands.has(brand)) {
        newBrands.delete(brand)
      } else {
        newBrands.add(brand)
      }
      return newBrands
    })
    setCurrentPage(1)
  }, [])

  // Handler pour toggle une gamme
  const handleRangeToggle = useCallback((range: string) => {
    setSelectedRanges(prev => {
      const newRanges = new Set(prev)
      if (newRanges.has(range)) {
        newRanges.delete(range)
      } else {
        newRanges.add(range)
      }
      return newRanges
    })
    setCurrentPage(1)
  }, [])

  // Handler pour sélectionner/désélectionner toutes les gammes d'une marque
  const handleBrandSelectAll = useCallback((brand: string, select: boolean) => {
    const brandRanges = rangesByBrand[brand] || []
    setSelectedRanges(prev => {
      const newRanges = new Set(prev)
      if (select) {
        brandRanges.forEach(range => newRanges.add(range))
      } else {
        brandRanges.forEach(range => newRanges.delete(range))
      }
      return newRanges
    })
    setCurrentPage(1)
  }, [rangesByBrand])

  // Fonction pour réinitialiser tous les filtres
  const clearAllFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedBrands(new Set())
    setSelectedRanges(new Set())
    setSelectedTags(
      Object.fromEntries(
        Object.keys(itemsByType).map(key => [key, new Set<string>()])
      )
    )
    setCurrentPage(1)
  }, [itemsByType])

  // Fonction de recherche optimisée
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Réinitialiser la pagination lors de la recherche
  }, [])

  // Calculer les compteurs de produits pour chaque filtre de manière dynamique
  const productCounts = useMemo(() => {
    const counts = {
      brands: {} as Record<string, number>,
      ranges: {} as Record<string, number>,
      tags: {} as Record<string, Record<string, number>>, // tags[tagType][tagName] = count
    }

    // Filtrer les produits en fonction des critères actuels SAUF le filtre qu'on est en train de compter
    const getFilteredProductsExcept = (excludeTagType?: string, excludeBrand = false, excludeRange = false) => {
      return products.filter(p => {
        // Filtre par recherche
        if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false
        }
        
        // Filtres existants
        if (!excludeBrand && selectedBrands.size > 0 && !selectedBrands.has(p.brand || '')) return false
        if (!excludeRange && selectedRanges.size > 0 && !selectedRanges.has(p.range || '')) return false
        
        // Filtres par tags (en excluant le type qu'on compte)
        for (const [tagType, setTags] of Object.entries(selectedTags)) {
          if (tagType !== excludeTagType && setTags.size > 0) {
            const labels = p.tags?.filter(t => t.category === tagType).map(t => t.label) ?? []
            if (![...setTags].some(t => labels.includes(t))) return false
          }
        }
        return true
      })
    }

    // Compter les produits pour chaque marque
    brands.forEach(brand => {
      const filtered = getFilteredProductsExcept(undefined, true, false)
      counts.brands[brand] = filtered.filter(p => p.brand === brand).length
    })

    // Compter les produits pour chaque gamme
    Object.values(rangesByBrand).flat().forEach(range => {
      const filtered = getFilteredProductsExcept(undefined, false, true)
      counts.ranges[range] = filtered.filter(p => p.range === range).length
    })

    // Compter dynamiquement pour chaque type de tag
    Object.entries(itemsByType).forEach(([tagType, tagNames]) => {
      counts.tags[tagType] = {}
      
      tagNames.forEach(tagName => {
        const filtered = getFilteredProductsExcept(tagType)
        counts.tags[tagType][tagName] = filtered.filter(p => 
          p.tags?.some(t => t.category === tagType && t.label === tagName)
        ).length
      })
    })

    return counts
  }, [products, searchTerm, selectedBrands, selectedRanges, selectedTags, itemsByType, brands, rangesByBrand])

  // Application des filtres et recherche
  const filtered = useMemo(
    () => {
      const filteredProducts = products.filter(p => {
        // Filtre par recherche
        if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false
        }
        
        // Filtres existants
        if (selectedBrands.size > 0 && !selectedBrands.has(p.brand || '')) return false
        if (selectedRanges.size > 0 && !selectedRanges.has(p.range || '')) return false
        
        // Filtres par tags dynamiques
        for (const [tagType, setTags] of Object.entries(selectedTags)) {
          if (setTags.size > 0) {
            const labels = p.tags?.filter(t => t.category === tagType).map(t => t.label) ?? []
            if (![...setTags].some(t => labels.includes(t))) return false
          }
        }
        return true
      })

      // Tri optimisé
      filteredProducts.sort((a, b) => {
        switch (sortBy) {
          case 'bestsellers':
            // Pour l'instant, tri par nom (à adapter selon vos besoins)
            return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
          case 'az':
            return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
          case 'za':
            return b.name.localeCompare(a.name, 'fr', { sensitivity: 'base' })
          case 'price-asc':
            return a.price - b.price
          case 'price-desc':
            return b.price - a.price
          default:
            return 0
        }
      })

      return filteredProducts
    },
    [products, searchTerm, selectedBrands, selectedRanges, selectedTags, sortBy]
  )

  // Pagination optimisée
  const totalPages = Math.ceil(filtered.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = filtered.slice(startIndex, endIndex)

  // ─── Décompte pour la pilule mobile ───
  // Compte le nombre de GROUPES de filtres actifs (pas le total d'options).
  // ex: 2 marques + 1 besoin + 0 prix → groupCount = 2 (marques + besoins).
  const groupCount = useMemo(() => {
    let count = 0
    if (selectedBrands.size > 0) count += 1
    if (selectedRanges.size > 0) count += 1
    for (const set of Object.values(selectedTags)) {
      if (set.size > 0) count += 1
    }
    return count
  }, [selectedBrands, selectedRanges, selectedTags])

  // Liste des filtres actifs individuels pour la barre de pills au-dessus
  // de la pilule (chacun retirable au clic ×).
  const activeFilters = useMemo<ActiveFilterPill[]>(() => {
    const pills: ActiveFilterPill[] = []
    selectedBrands.forEach((brand) =>
      pills.push({
        id: `brand:${brand}`,
        label: brand,
        onRemove: () => handleBrandToggle(brand),
      }),
    )
    selectedRanges.forEach((range) =>
      pills.push({
        id: `range:${range}`,
        label: range,
        onRemove: () => handleRangeToggle(range),
      }),
    )
    for (const [tagType, set] of Object.entries(selectedTags)) {
      set.forEach((name) =>
        pills.push({
          id: `${tagType}:${name}`,
          label: name,
          onRemove: () => handleTagToggle(tagType, name),
        }),
      )
    }
    return pills
  }, [
    selectedBrands,
    selectedRanges,
    selectedTags,
    handleBrandToggle,
    handleRangeToggle,
    handleTagToggle,
  ])

  // Gestionnaires de pagination
  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [totalPages])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div className="catalogue max-w-7xl mx-auto">
      {/* Ligne 1: Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 border border-sand-300 rounded-lg focus-visible:outline-none focus-visible:border-clay-600 transition-colors"
            aria-label={t('searchAriaLabel')}
          />
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Ligne 2: Filtres à gauche et produits à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Colonne des filtres : desktop only, mobile utilise la pilule + sheet */}
        <div className="hidden lg:block lg:col-span-1">
          <Filters
            sortOption={sortBy}
            onSortChange={setSortBy}
            availableBrands={brands}
            rangesByBrand={rangesByBrand}
            // Passer les données dynamiques
            itemsByType={itemsByType}
            selectedBrands={selectedBrands}
            selectedRanges={selectedRanges}
            selectedTags={selectedTags}
            onBrandToggle={handleBrandToggle}
            onRangeToggle={handleRangeToggle}
            onBrandSelectAll={handleBrandSelectAll}
            onTagToggle={handleTagToggle}
            onClearFilters={clearAllFilters}
            productCounts={productCounts}
          />
        </div>

        {/* Colonne des produits — pleine largeur sous lg */}
        <div className="lg:col-span-3 pb-24 lg:pb-0">
          {/* Chips de filtres actifs (desktop only — mobile a la FiltersPill) */}
          {activeFilters.length > 0 && (
            <div className="hidden lg:flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500 mr-1">
                {t('activeFiltersLabel')}
              </span>
              {activeFilters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={f.onRemove}
                  className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full bg-ink-900 text-sand-50 text-[12.5px] font-medium hover:bg-ink-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
                  aria-label={t('removeFilterAriaLabel', { label: f.label })}
                >
                  {f.label}
                  <span aria-hidden="true" className="text-sand-300 text-[14px] leading-none">×</span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-1 text-[12px] text-ink-500 hover:text-clay-700 underline decoration-dotted underline-offset-2 transition-colors"
              >
                {t('resetFilters')}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {currentProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          
          {currentProducts.length === 0 && (
            <div className="text-center py-12 text-ink-500">
              <p>{t('noResults')}</p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-clay-700 text-white rounded-lg hover:bg-clay-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
              >
                {t('resetFilters')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ligne 3: Pagination */}
      {totalPages > 1 && (
        <nav className="flex justify-center items-center space-x-2" aria-label={t('paginationAriaLabel')}>
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
            aria-label={t('previousPageAriaLabel')}
          >
            {t('previousPage')}
          </button>

          {buildPageRange(currentPage, totalPages, 1).map((entry, idx) =>
            entry === 'ellipsis' ? (
              <span
                key={`e-${idx}`}
                aria-hidden="true"
                className="px-2 text-ink-400 select-none"
              >
                …
              </span>
            ) : (
              <button
                key={entry}
                onClick={() => handlePageChange(entry)}
                className={`px-4 py-2 border rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700 ${
                  currentPage === entry
                    ? 'bg-clay-700 text-white border-clay-600'
                    : 'hover:bg-sand-50'
                }`}
                aria-label={t('pageAriaLabel', { page: entry })}
                aria-current={currentPage === entry ? 'page' : undefined}
              >
                {entry}
              </button>
            ),
          )}

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
            aria-label={t('nextPageAriaLabel')}
          >
            {t('nextPage')}
          </button>
        </nav>
      )}

      {/* ─── Mobile-only : pilule sticky + bottom sheet via <dialog> natif ─── */}
      <FiltersPill
        groupCount={groupCount}
        activeFilters={activeFilters}
        onOpen={() => setSheetOpen(true)}
        hidden={products.length === 0}
      />
      <FiltersMobileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        matchedCount={filtered.length}
        availableBrands={brands}
        itemsByType={itemsByType}
        sort={sortBy}
        selectedBrands={selectedBrands}
        selectedTags={selectedTags}
        onSortChange={setSortBy}
        onBrandToggle={handleBrandToggle}
        onTagToggle={handleTagToggle}
        onClearAll={clearAllFilters}
        productCounts={productCounts}
      />
    </div>
  )
}
