'use client'

import React, { useEffect, useMemo, useRef, useCallback, useTransition, useOptimistic } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import ProductCard from '@/components/ProductCard'
import { CatalogueHeader } from '@/components/catalogue/CatalogueHeader'
import { CatalogueToolbar, type SortKey } from '@/components/catalogue/CatalogueToolbar'
import { CatalogueSidebar } from '@/components/catalogue/CatalogueSidebar'
import { CataloguePagination } from '@/components/catalogue/CataloguePagination'
import { FiltersMobileSheet } from '@/components/catalogue/FiltersMobileSheet'
import { FiltersPill, type ActiveFilterPill } from '@/components/catalogue/FiltersPill'
import { useBrowserBottomInset } from '@/hooks/useBrowserBottomInset'
import {
  buildCatalogueUrl,
  deriveBrandTreeModel,
  buildSelectionFromModel,
  type BrandTreeModel,
  type FilterState,
  type FacetedCounts,
  type CatalogueProduct,
} from '@/lib/catalogueFilters'

interface CatalogueClientProps {
  products: CatalogueProduct[]
  visibleCount: number
  totalCount: number
  currentPage: number
  totalPages: number
  sortBy: SortKey
  availableBrands: string[]
  rangesByBrand: Record<string, string[]>
  itemsByType: Record<string, string[]>
  selectedBrands: string[]
  /** Toujours [] après normalisation serveur (les gammes nues des deep-links
   *  sont converties en pairs) — conservé pour la parité de forme FilterState. */
  selectedRanges: string[]
  selectedPairs: Record<string, string[]>
  selectedTags: Record<string, string[]>
  searchTerm: string
  productCounts: FacetedCounts
}

export default function CatalogueClient({
  products,
  visibleCount,
  totalCount,
  currentPage,
  totalPages,
  sortBy,
  availableBrands,
  rangesByBrand,
  itemsByType,
  selectedBrands,
  selectedRanges,
  selectedPairs,
  selectedTags,
  searchTerm,
  productCounts,
}: CatalogueClientProps) {
  const t = useTranslations('Catalogue')
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Expose la hauteur de la barre Safari basse en CSS pour caler la pilule de
  // filtres + le CTA du sheet au-dessus d'elle (sinon à moitié cachés/inertes).
  useBrowserBottomInset()

  const filterState: FilterState = useMemo(() => ({
    brands: selectedBrands,
    ranges: selectedRanges,
    pairs: selectedPairs,
    tags: selectedTags,
    q: searchTerm,
    sort: sortBy,
    page: currentPage,
  }), [selectedBrands, selectedRanges, selectedPairs, selectedTags, searchTerm, sortBy, currentPage])

  // Les handlers composent sur une ref d'état « en attente » plutôt que sur
  // les props : des toggles séquentiels dans le même tick (ex. le revert du
  // sheet mobile qui rejoue N toggles d'un coup) liraient sinon tous le même
  // état figé et seule la dernière navigation gagnerait.
  const pendingRef = useRef<FilterState>(filterState)
  useEffect(() => {
    pendingRef.current = filterState
  }, [filterState])

  // État optimiste : un tap de filtre déclenche une navigation RSC (re-fetch
  // catalogue), plusieurs centaines de ms sur mobile. Sans optimisme, la case
  // ne se coche qu'au retour serveur → « les boutons mettent des secondes à se
  // sélectionner ». useOptimistic reflète le patch immédiatement pendant la
  // transition, puis se réaligne sur les props quand la navigation aboutit.
  const [optimistic, addOptimistic] = useOptimistic(
    filterState,
    (current: FilterState, patch: Partial<FilterState>): FilterState => ({ ...current, ...patch }),
  )

  const navigate = useCallback((overrides: Partial<FilterState>) => {
    const next = { ...pendingRef.current, page: 1, ...overrides }
    pendingRef.current = next
    const url = buildCatalogueUrl(pathname, next)
    startTransition(() => {
      addOptimistic(overrides)
      router.push(url, { scroll: false })
    })
  }, [pathname, router, addOptimistic])

  // Modèle de l'arbre Marque → Gammes (full | sous-ensemble par marque).
  // Dérivé de l'état OPTIMISTE → l'arbre/les cases reflètent le tap sans attendre
  // le serveur.
  const treeModel: BrandTreeModel = useMemo(
    () => deriveBrandTreeModel(optimistic.brands, optimistic.ranges, optimistic.pairs, rangesByBrand),
    [optimistic.brands, optimistic.ranges, optimistic.pairs, rangesByBrand],
  )

  const pendingModel = useCallback(() => {
    const s = pendingRef.current
    return deriveBrandTreeModel(s.brands, s.ranges, s.pairs, rangesByBrand)
  }, [rangesByBrand])

  const applyModel = useCallback((model: BrandTreeModel) => {
    navigate(buildSelectionFromModel(model))
  }, [navigate])

  /** Coche/décoche une marque ENTIÈRE (aussi utilisé par le sheet mobile). */
  const handleBrandToggle = useCallback((brand: string) => {
    const model = pendingModel()
    if (model[brand]) delete model[brand]
    else model[brand] = 'full'
    applyModel(model)
  }, [pendingModel, applyModel])

  /** Coche/décoche une gamme ; promeut/démet full ↔ sous-ensemble. */
  const handleRangeToggle = useCallback((brand: string, range: string) => {
    const model = pendingModel()
    const allRanges = rangesByBrand[brand] ?? []
    const current = model[brand]
    let subset: string[]
    if (current === 'full') subset = allRanges.filter((r) => r !== range)
    else if (current) {
      subset = current.includes(range)
        ? current.filter((r) => r !== range)
        : [...current, range]
    } else subset = [range]
    if (subset.length === 0) delete model[brand]
    else if (subset.length === allRanges.length) model[brand] = 'full'
    else model[brand] = subset
    applyModel(model)
  }, [pendingModel, applyModel, rangesByBrand])

  const handleTagToggle = useCallback((tagType: string, tagName: string) => {
    const tags = pendingRef.current.tags
    const current = tags[tagType] || []
    const next = current.includes(tagName)
      ? current.filter((n) => n !== tagName)
      : [...current, tagName]
    navigate({ tags: { ...tags, [tagType]: next } })
  }, [navigate])

  /** Snapshot/restore complet pour le Cancel du sheet mobile (un seul
   *  navigate — préserve les sélections partielles de l'arbre). */
  const captureFilters = useCallback(() => pendingRef.current, [])

  const restoreFilters = useCallback((snapshot: FilterState) => {
    navigate({ ...snapshot })
  }, [navigate])

  const handleSortChange = useCallback((sort: SortKey) => {
    navigate({ sort })
  }, [navigate])

  const clearSearchQuery = useCallback(() => {
    navigate({ q: '' })
  }, [navigate])

  const clearAllFilters = useCallback(() => {
    const emptyTags: Record<string, string[]> = {}
    for (const key of Object.keys(itemsByType)) emptyTags[key] = []
    navigate({ brands: [], ranges: [], pairs: {}, tags: emptyTags, q: '' })
  }, [itemsByType, navigate])

  const handlePageChange = useCallback((page: number) => {
    const next = { ...pendingRef.current, page }
    pendingRef.current = next
    const url = buildCatalogueUrl(pathname, next)
    startTransition(() => {
      router.push(url, { scroll: true })
    })
  }, [pathname, router])

  const handlePreviousPage = useCallback(() => {
    handlePageChange(Math.max(currentPage - 1, 1))
  }, [currentPage, handlePageChange])

  const handleNextPage = useCallback(() => {
    handlePageChange(Math.min(currentPage + 1, totalPages))
  }, [currentPage, totalPages, handlePageChange])

  const [sheetOpen, setSheetOpen] = React.useState(false)

  // Pour le sheet mobile (toggle au niveau marque) : une marque est « on »
  // dès qu'elle a une entrée dans le modèle (pleine ou partielle).
  const selectedBrandsSet = useMemo(() => new Set(Object.keys(treeModel)), [treeModel])
  const selectedTagsSets = useMemo(() => {
    const out: Record<string, Set<string>> = {}
    for (const [k, v] of Object.entries(optimistic.tags)) out[k] = new Set(v)
    for (const k of Object.keys(itemsByType)) out[k] ??= new Set()
    return out
  }, [optimistic.tags, itemsByType])

  const groupCount = useMemo(() => {
    // L'arbre Marque · Gamme compte pour UN groupe de filtres.
    let count = Object.keys(treeModel).length > 0 ? 1 : 0
    for (const arr of Object.values(optimistic.tags)) {
      if (arr.length > 0) count += 1
    }
    return count
  }, [treeModel, optimistic.tags])

  const activeFilters = useMemo<ActiveFilterPill[]>(() => {
    const pills: ActiveFilterPill[] = []
    if (optimistic.q) {
      pills.push({ id: 'search', label: `« ${optimistic.q} »`, onRemove: clearSearchQuery })
    }
    for (const [brand, value] of Object.entries(treeModel)) {
      if (value === 'full') {
        pills.push({ id: `brand:${brand}`, label: brand, onRemove: () => handleBrandToggle(brand) })
      } else {
        value.forEach((range) =>
          pills.push({
            id: `range:${brand}:${range}`,
            label: `${brand} · ${range}`,
            onRemove: () => handleRangeToggle(brand, range),
          }),
        )
      }
    }
    for (const [tagType, names] of Object.entries(optimistic.tags)) {
      names.forEach((name) =>
        pills.push({ id: `${tagType}:${name}`, label: name, onRemove: () => handleTagToggle(tagType, name) }),
      )
    }
    return pills
  }, [optimistic.q, treeModel, optimistic.tags, handleBrandToggle, handleRangeToggle, handleTagToggle, clearSearchQuery])

  const startIndex = (currentPage - 1) * 24
  const endIndex = startIndex + products.length

  return (
    <div className={isPending ? 'opacity-70 transition-opacity duration-200' : ''}>
      <CatalogueHeader visible={visibleCount} total={totalCount} activeCount={activeFilters.length} />
      {/* Barre sticky DESKTOP uniquement : sur mobile, le tri + les chips font
          doublon avec la pilule « Filtres » du bas (qui ouvre le sheet incluant
          le tri) et les chips flottants. → allègement mobile « Léger ». */}
      <CatalogueToolbar
        className="hidden lg:block"
        activeFilters={activeFilters}
        onClearAll={clearAllFilters}
        sort={optimistic.sort}
        onSortChange={handleSortChange}
      />

      <div className="max-w-[1480px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-14 px-5 lg:px-10 py-10 lg:py-12 pb-24 lg:pb-20">
        <div className="hidden lg:block">
          <CatalogueSidebar
            availableBrands={availableBrands}
            rangesByBrand={rangesByBrand}
            itemsByType={itemsByType}
            treeModel={treeModel}
            selectedTags={selectedTagsSets}
            onBrandToggle={handleBrandToggle}
            onRangeToggle={handleRangeToggle}
            onTagToggle={handleTagToggle}
            productCounts={productCounts}
          />
        </div>

        <main>
          {/* Ligne « Affichage de X à Y sur Z » : DESKTOP uniquement — le header
              affiche déjà le compteur, redondant sur mobile (allègement « Léger »). */}
          {visibleCount > 0 && (
            <div className="hidden lg:flex justify-between items-baseline mb-6 font-mono text-[11px] tracking-[0.12em] uppercase text-ink-500">
              <span>
                {t.rich('gridShowing', {
                  from: startIndex + 1,
                  to: Math.min(endIndex, visibleCount),
                  total: visibleCount,
                  b: (chunks) => (
                    <b className="text-ink-900 font-medium">{chunks}</b>
                  ),
                })}
              </span>
              <span className="hidden sm:inline">{t('gridCuration')}</span>
            </div>
          )}

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-[18px]">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-ink-500">
              <p className="font-serif text-[20px] mb-5">{t('noResults')}</p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-clay-700 text-on-accent rounded-[3px] text-[13px] font-medium hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
              >
                {t('resetFilters')}
              </button>
            </div>
          )}

          <CataloguePagination
            currentPage={currentPage}
            totalPages={totalPages}
            perPage={24}
            onPageChange={handlePageChange}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
          />
        </main>
      </div>

      <FiltersPill
        groupCount={groupCount}
        activeFilters={activeFilters}
        onOpen={() => setSheetOpen(true)}
        hidden={totalCount === 0}
      />
      <FiltersMobileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        matchedCount={visibleCount}
        availableBrands={availableBrands}
        itemsByType={itemsByType}
        sort={optimistic.sort}
        selectedBrands={selectedBrandsSet}
        selectedTags={selectedTagsSets}
        onSortChange={(v) => handleSortChange(v as SortKey)}
        onBrandToggle={handleBrandToggle}
        onTagToggle={handleTagToggle}
        onClearAll={clearAllFilters}
        captureFilters={captureFilters}
        onRestoreFilters={restoreFilters}
        productCounts={productCounts}
      />
    </div>
  )
}
