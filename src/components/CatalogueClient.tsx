'use client'
import React, { useState, useMemo, useCallback } from 'react'
import ProductCard from '@/components/ProductCard'
import Filters from '@/components/Filters'

interface TagItem { label: string; category: string }
interface Product {
  id: string
  name: string
  price: number
  currency: string
  images: { url: string; alt: string }[]
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
  // États pour la recherche et le tri
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('bestsellers')

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 18 // 3 produits par ligne × 6 lignes

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
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            aria-label="Rechercher un produit"
          />
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
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
        {/* Colonne des filtres */}
        <div className="lg:col-span-1">
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

        {/* Colonne des produits */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          
          {currentProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Aucun produit trouvé avec les critères sélectionnés.</p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ligne 3: Pagination */}
      {totalPages > 1 && (
        <nav className="flex justify-center items-center space-x-2" aria-label="Pagination">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors focus:outline-none"
            aria-label="Page précédente"
          >
            Précédent
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 border rounded-lg transition-colors focus:outline-none ${
                currentPage === page
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors focus:outline-none"
            aria-label="Page suivante"
          >
            Suivant
          </button>
        </nav>
      )}
    </div>
  )
}
