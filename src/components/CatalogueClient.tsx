'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import ProductCard from '@/components/ProductCard'
import { CatalogueHeader } from '@/components/catalogue/CatalogueHeader'
import { CatalogueToolbar, type SortKey } from '@/components/catalogue/CatalogueToolbar'
import { CatalogueSidebar } from '@/components/catalogue/CatalogueSidebar'
import { CataloguePagination } from '@/components/catalogue/CataloguePagination'
import { FiltersMobileSheet } from '@/components/catalogue/FiltersMobileSheet'
import { FiltersPill, type ActiveFilterPill } from '@/components/catalogue/FiltersPill'

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

interface TagItem {
  label: string
  category: string
}

interface Product {
  id: string
  slug: string
  name: string
  description?: string
  price: number
  oldPrice?: number
  currency: string
  images: { url: string; alt: string | null }[]
  brand?: string
  range?: string
  stock?: number
  isNew?: boolean
  isFeatured?: boolean
  volume?: string | null
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initialQuery = searchParams.get('q') ?? ''

  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [sortBy, setSortBy] = useState<SortKey>('bestsellers')
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 18

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    setSearchTerm(q)
    setCurrentPage(1)
  }, [searchParams])

  const brands = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.brand).filter((b): b is string => !!b)),
      ).sort(),
    [products],
  )

  const rangesByBrand = useMemo(() => {
    const grouped: Record<string, string[]> = {}
    products.forEach((p) => {
      if (p.brand && p.range) {
        grouped[p.brand] ??= []
        if (!grouped[p.brand].includes(p.range)) grouped[p.brand].push(p.range)
      }
    })
    Object.keys(grouped).forEach((brand) => grouped[brand].sort())
    return grouped
  }, [products])

  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  const [selectedRanges, setSelectedRanges] = useState<Set<string>>(new Set())
  const [selectedTags, setSelectedTags] = useState<Record<string, Set<string>>>(
    () =>
      Object.fromEntries(
        Object.keys(itemsByType).map((key) => [key, new Set<string>()]),
      ),
  )

  useEffect(() => {
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

    const nextTags: Record<string, Set<string>> = Object.fromEntries(
      Object.keys(itemsByType).map((k) => [k, new Set<string>()]),
    )

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
    setSelectedTags((prev) => {
      const s = new Set(prev[tagType])
      if (s.has(tagName)) s.delete(tagName)
      else s.add(tagName)
      return { ...prev, [tagType]: s }
    })
    setCurrentPage(1)
  }, [])

  const [sheetOpen, setSheetOpen] = useState(false)

  const handleBrandToggle = useCallback((brand: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev)
      if (next.has(brand)) next.delete(brand)
      else next.add(brand)
      return next
    })
    setCurrentPage(1)
  }, [])

  const handleRangeToggle = useCallback((range: string) => {
    setSelectedRanges((prev) => {
      const next = new Set(prev)
      if (next.has(range)) next.delete(range)
      else next.add(range)
      return next
    })
    setCurrentPage(1)
  }, [])

  const handleBrandSelectAll = useCallback(
    (brand: string, select: boolean) => {
      const brandRanges = rangesByBrand[brand] || []
      setSelectedRanges((prev) => {
        const next = new Set(prev)
        if (select) brandRanges.forEach((r) => next.add(r))
        else brandRanges.forEach((r) => next.delete(r))
        return next
      })
      setCurrentPage(1)
    },
    [rangesByBrand],
  )

  /** Efface ?q= de l'URL et le state local. */
  const clearSearchQuery = useCallback(() => {
    setSearchTerm('')
    setCurrentPage(1)
    if (searchParams.get('q')) {
      const next = new URLSearchParams(searchParams.toString())
      next.delete('q')
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }
  }, [searchParams, router, pathname])

  const clearAllFilters = useCallback(() => {
    setSelectedBrands(new Set())
    setSelectedRanges(new Set())
    setSelectedTags(
      Object.fromEntries(
        Object.keys(itemsByType).map((key) => [key, new Set<string>()]),
      ),
    )
    setCurrentPage(1)
    clearSearchQuery()
  }, [itemsByType, clearSearchQuery])

  /**
   * Counts dérivés, par filtre, en excluant la dimension courante (UX standard
   * « facetted search ») pour que l'utilisateur voie combien de produits
   * s'ajouteraient à sa sélection s'il cochait une option.
   */
  const productCounts = useMemo(() => {
    const counts = {
      brands: {} as Record<string, number>,
      ranges: {} as Record<string, number>,
      tags: {} as Record<string, Record<string, number>>,
    }

    const matches = (
      p: Product,
      excludeTagType?: string,
      excludeBrand = false,
      excludeRange = false,
    ) => {
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        return false
      if (!excludeBrand && selectedBrands.size > 0 && !selectedBrands.has(p.brand || ''))
        return false
      if (!excludeRange && selectedRanges.size > 0 && !selectedRanges.has(p.range || ''))
        return false
      for (const [tagType, setTags] of Object.entries(selectedTags)) {
        if (tagType !== excludeTagType && setTags.size > 0) {
          const labels = p.tags?.filter((tg) => tg.category === tagType).map((tg) => tg.label) ?? []
          if (![...setTags].some((tt) => labels.includes(tt))) return false
        }
      }
      return true
    }

    brands.forEach((brand) => {
      counts.brands[brand] = products.filter(
        (p) => matches(p, undefined, true, false) && p.brand === brand,
      ).length
    })

    Object.values(rangesByBrand)
      .flat()
      .forEach((range) => {
        counts.ranges[range] = products.filter(
          (p) => matches(p, undefined, false, true) && p.range === range,
        ).length
      })

    Object.entries(itemsByType).forEach(([tagType, tagNames]) => {
      counts.tags[tagType] = {}
      tagNames.forEach((name) => {
        counts.tags[tagType][name] = products.filter(
          (p) =>
            matches(p, tagType) &&
            p.tags?.some((tg) => tg.category === tagType && tg.label === name),
        ).length
      })
    })

    return counts
  }, [products, searchTerm, selectedBrands, selectedRanges, selectedTags, itemsByType, brands, rangesByBrand])

  const filtered = useMemo(() => {
    const out = products.filter((p) => {
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        return false
      if (selectedBrands.size > 0 && !selectedBrands.has(p.brand || '')) return false
      if (selectedRanges.size > 0 && !selectedRanges.has(p.range || '')) return false
      for (const [tagType, setTags] of Object.entries(selectedTags)) {
        if (setTags.size > 0) {
          const labels = p.tags?.filter((tg) => tg.category === tagType).map((tg) => tg.label) ?? []
          if (![...setTags].some((tt) => labels.includes(tt))) return false
        }
      }
      return true
    })

    out.sort((a, b) => {
      switch (sortBy) {
        case 'bestsellers': {
          // is_featured prioritaire, fallback alpha (la popularité réelle vit
          // dans la vue v_bestsellers et n'est pas exposée sur products).
          const aw = a.isFeatured ? 1 : 0
          const bw = b.isFeatured ? 1 : 0
          if (aw !== bw) return bw - aw
          return a.name.localeCompare(b.name)
        }
        case 'az':
          return a.name.localeCompare(b.name)
        case 'za':
          return b.name.localeCompare(a.name)
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        default:
          return 0
      }
    })

    return out
  }, [products, searchTerm, selectedBrands, selectedRanges, selectedTags, sortBy])

  const totalPages = Math.ceil(filtered.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = filtered.slice(startIndex, endIndex)

  const groupCount = useMemo(() => {
    let count = 0
    if (selectedBrands.size > 0) count += 1
    if (selectedRanges.size > 0) count += 1
    for (const set of Object.values(selectedTags)) {
      if (set.size > 0) count += 1
    }
    return count
  }, [selectedBrands, selectedRanges, selectedTags])

  const activeFilters = useMemo<ActiveFilterPill[]>(() => {
    const pills: ActiveFilterPill[] = []
    if (searchTerm) {
      pills.push({
        id: 'search',
        label: `« ${searchTerm} »`,
        onRemove: clearSearchQuery,
      })
    }
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
    searchTerm,
    selectedBrands,
    selectedRanges,
    selectedTags,
    handleBrandToggle,
    handleRangeToggle,
    handleTagToggle,
    clearSearchQuery,
  ])

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [totalPages])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const visible = filtered.length
  const total = products.length

  return (
    <>
      <CatalogueHeader visible={visible} total={total} activeCount={activeFilters.length} />
      <CatalogueToolbar
        activeFilters={activeFilters}
        onClearAll={clearAllFilters}
        sort={sortBy}
        onSortChange={setSortBy}
      />

      <div className="max-w-[1480px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-14 px-5 lg:px-10 py-10 lg:py-12 pb-24 lg:pb-20">
        <div className="hidden lg:block">
          <CatalogueSidebar
            availableBrands={brands}
            rangesByBrand={rangesByBrand}
            itemsByType={itemsByType}
            selectedBrands={selectedBrands}
            selectedRanges={selectedRanges}
            selectedTags={selectedTags}
            onBrandToggle={handleBrandToggle}
            onRangeToggle={handleRangeToggle}
            onBrandSelectAll={handleBrandSelectAll}
            onTagToggle={handleTagToggle}
            productCounts={productCounts}
          />
        </div>

        <main>
          {visible > 0 && (
            <div className="flex justify-between items-baseline mb-6 font-mono text-[11px] tracking-[0.12em] uppercase text-ink-500">
              <span>
                {t.rich('gridShowing', {
                  from: startIndex + 1,
                  to: Math.min(endIndex, visible),
                  total: visible,
                  b: (chunks) => (
                    <b className="text-ink-900 font-medium">{chunks}</b>
                  ),
                })}
              </span>
              <span className="hidden sm:inline">{t('gridCuration')}</span>
            </div>
          )}

          {currentProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {currentProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-ink-500">
              <p className="font-serif text-[20px] mb-5">{t('noResults')}</p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-clay-700 text-sand-50 rounded-[3px] text-[13px] font-medium hover:bg-clay-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
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
        onSortChange={(v) => setSortBy(v as SortKey)}
        onBrandToggle={handleBrandToggle}
        onTagToggle={handleTagToggle}
        onClearAll={clearAllFilters}
        productCounts={productCounts}
      />
    </>
  )
}
