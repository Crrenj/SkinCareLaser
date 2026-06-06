'use client'

import React, { useMemo, useCallback, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import ProductCard from '@/components/ProductCard'
import { CatalogueHeader } from '@/components/catalogue/CatalogueHeader'
import { CatalogueToolbar, type SortKey } from '@/components/catalogue/CatalogueToolbar'
import { CatalogueSidebar } from '@/components/catalogue/CatalogueSidebar'
import { CataloguePagination } from '@/components/catalogue/CataloguePagination'
import { FiltersMobileSheet } from '@/components/catalogue/FiltersMobileSheet'
import { FiltersPill, type ActiveFilterPill } from '@/components/catalogue/FiltersPill'
import { buildCatalogueUrl, type FilterState, type FacetedCounts, type CatalogueProduct } from '@/lib/catalogueFilters'

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
  selectedRanges: string[]
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
  selectedTags,
  searchTerm,
  productCounts,
}: CatalogueClientProps) {
  const t = useTranslations('Catalogue')
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const filterState: FilterState = useMemo(() => ({
    brands: selectedBrands,
    ranges: selectedRanges,
    tags: selectedTags,
    q: searchTerm,
    sort: sortBy,
    page: currentPage,
  }), [selectedBrands, selectedRanges, selectedTags, searchTerm, sortBy, currentPage])

  const navigate = useCallback((overrides: Partial<FilterState>) => {
    const url = buildCatalogueUrl(pathname, filterState, { page: 1, ...overrides })
    startTransition(() => {
      router.push(url, { scroll: false })
    })
  }, [pathname, filterState, router])

  const handleBrandToggle = useCallback((brand: string) => {
    const next = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand]
    navigate({ brands: next })
  }, [selectedBrands, navigate])

  const handleRangeToggle = useCallback((range: string) => {
    const next = selectedRanges.includes(range)
      ? selectedRanges.filter((r) => r !== range)
      : [...selectedRanges, range]
    navigate({ ranges: next })
  }, [selectedRanges, navigate])

  const handleBrandSelectAll = useCallback(
    (brand: string, select: boolean) => {
      const brandRanges = rangesByBrand[brand] || []
      const next = select
        ? [...new Set([...selectedRanges, ...brandRanges])]
        : selectedRanges.filter((r) => !brandRanges.includes(r))
      navigate({ ranges: next })
    },
    [rangesByBrand, selectedRanges, navigate],
  )

  const handleTagToggle = useCallback((tagType: string, tagName: string) => {
    const current = selectedTags[tagType] || []
    const next = current.includes(tagName)
      ? current.filter((n) => n !== tagName)
      : [...current, tagName]
    navigate({ tags: { ...selectedTags, [tagType]: next } })
  }, [selectedTags, navigate])

  const handleSortChange = useCallback((sort: SortKey) => {
    navigate({ sort })
  }, [navigate])

  const clearSearchQuery = useCallback(() => {
    navigate({ q: '' })
  }, [navigate])

  const clearAllFilters = useCallback(() => {
    const emptyTags: Record<string, string[]> = {}
    for (const key of Object.keys(itemsByType)) emptyTags[key] = []
    navigate({ brands: [], ranges: [], tags: emptyTags, q: '' })
  }, [itemsByType, navigate])

  const handlePageChange = useCallback((page: number) => {
    const url = buildCatalogueUrl(pathname, filterState, { page })
    startTransition(() => {
      router.push(url, { scroll: true })
    })
  }, [pathname, filterState, router])

  const handlePreviousPage = useCallback(() => {
    handlePageChange(Math.max(currentPage - 1, 1))
  }, [currentPage, handlePageChange])

  const handleNextPage = useCallback(() => {
    handlePageChange(Math.min(currentPage + 1, totalPages))
  }, [currentPage, totalPages, handlePageChange])

  const [sheetOpen, setSheetOpen] = React.useState(false)

  const selectedBrandsSet = useMemo(() => new Set(selectedBrands), [selectedBrands])
  const selectedRangesSet = useMemo(() => new Set(selectedRanges), [selectedRanges])
  const selectedTagsSets = useMemo(() => {
    const out: Record<string, Set<string>> = {}
    for (const [k, v] of Object.entries(selectedTags)) out[k] = new Set(v)
    for (const k of Object.keys(itemsByType)) out[k] ??= new Set()
    return out
  }, [selectedTags, itemsByType])

  const groupCount = useMemo(() => {
    let count = 0
    if (selectedBrands.length > 0) count += 1
    if (selectedRanges.length > 0) count += 1
    for (const arr of Object.values(selectedTags)) {
      if (arr.length > 0) count += 1
    }
    return count
  }, [selectedBrands, selectedRanges, selectedTags])

  const activeFilters = useMemo<ActiveFilterPill[]>(() => {
    const pills: ActiveFilterPill[] = []
    if (searchTerm) {
      pills.push({ id: 'search', label: `« ${searchTerm} »`, onRemove: clearSearchQuery })
    }
    selectedBrands.forEach((brand) =>
      pills.push({ id: `brand:${brand}`, label: brand, onRemove: () => handleBrandToggle(brand) }),
    )
    selectedRanges.forEach((range) =>
      pills.push({ id: `range:${range}`, label: range, onRemove: () => handleRangeToggle(range) }),
    )
    for (const [tagType, names] of Object.entries(selectedTags)) {
      names.forEach((name) =>
        pills.push({ id: `${tagType}:${name}`, label: name, onRemove: () => handleTagToggle(tagType, name) }),
      )
    }
    return pills
  }, [searchTerm, selectedBrands, selectedRanges, selectedTags, handleBrandToggle, handleRangeToggle, handleTagToggle, clearSearchQuery])

  const startIndex = (currentPage - 1) * 24
  const endIndex = startIndex + products.length

  return (
    <div className={isPending ? 'opacity-70 transition-opacity duration-200' : ''}>
      <CatalogueHeader visible={visibleCount} total={totalCount} activeCount={activeFilters.length} />
      <CatalogueToolbar
        activeFilters={activeFilters}
        onClearAll={clearAllFilters}
        sort={sortBy}
        onSortChange={handleSortChange}
      />

      <div className="max-w-[1480px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-14 px-5 lg:px-10 py-10 lg:py-12 pb-24 lg:pb-20">
        <div className="hidden lg:block">
          <CatalogueSidebar
            availableBrands={availableBrands}
            rangesByBrand={rangesByBrand}
            itemsByType={itemsByType}
            selectedBrands={selectedBrandsSet}
            selectedRanges={selectedRangesSet}
            selectedTags={selectedTagsSets}
            onBrandToggle={handleBrandToggle}
            onRangeToggle={handleRangeToggle}
            onBrandSelectAll={handleBrandSelectAll}
            onTagToggle={handleTagToggle}
            productCounts={productCounts}
          />
        </div>

        <main>
          {visibleCount > 0 && (
            <div className="flex justify-between items-baseline mb-6 font-mono text-[11px] tracking-[0.12em] uppercase text-ink-500">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
        sort={sortBy}
        selectedBrands={selectedBrandsSet}
        selectedTags={selectedTagsSets}
        onSortChange={(v) => handleSortChange(v as SortKey)}
        onBrandToggle={handleBrandToggle}
        onTagToggle={handleTagToggle}
        onClearAll={clearAllFilters}
        productCounts={productCounts}
      />
    </div>
  )
}
