'use client'
import React, { useState, useMemo } from 'react'
import ProductCard from '@/components/ProductCard'
import Filters from '@/components/Filters'
import SortSelector from '@/components/SortSelector'

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
  const [sortBy, setSortBy] = useState('az')

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 12 // 3 produits par ligne × 4 lignes

  // listes dynamiques
  const brands = useMemo(
    () =>
      Array.from(
        new Set(products.map(p => p.brand).filter((b): b is string => !!b))
      ).sort(),
    [products]
  )
  const ranges = useMemo(
    () =>
      Array.from(
        new Set(products.map(p => p.range).filter((r): r is string => !!r))
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

  // états des filtres
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedRange, setSelectedRange] = useState('')
  const [selectedTags, setSelectedTags] = useState<Record<string, Set<string>>>(
    () =>
      Object.fromEntries(
        Object.keys(itemsByType).map(key => [key, new Set<string>()])
      )
  )

  const handleTagToggle = (cat: string, tag: string) => {
    setSelectedTags(prev => {
      const s = new Set(prev[cat])
      s.has(tag) ? s.delete(tag) : s.add(tag)
      return { ...prev, [cat]: s }
    })
  }

  // Fonction pour réinitialiser tous les filtres
  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedBrand('')
    setSelectedRange('')
    setSelectedTags(
      Object.fromEntries(
        Object.keys(itemsByType).map(key => [key, new Set<string>()])
      )
    )
    setCurrentPage(1)
  }

  // Réinitialiser la gamme quand la marque change
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand)
    setSelectedRange('') // Réinitialiser la gamme sélectionnée
    setCurrentPage(1)
  }

  // application des filtres et recherche
  const filtered = useMemo(
    () => {
      let filteredProducts = products.filter(p => {
        // Filtre par recherche
        if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false
        }
        
        // Filtres existants
        if (selectedBrand && p.brand !== selectedBrand) return false
        if (selectedRange && p.range !== selectedRange) return false
        for (const [cat, setTags] of Object.entries(selectedTags)) {
          if (setTags.size > 0) {
            const labels =
              p.tags?.filter(t => t.category === cat).map(t => t.label) ?? []
            if (![...setTags].some(t => labels.includes(t))) return false
          }
        }
        return true
      })

      // Tri
      filteredProducts.sort((a, b) => {
        switch (sortBy) {
          case 'az':
            return a.name.localeCompare(b.name)
          case 'za':
            return b.name.localeCompare(a.name)
          case 'price-asc':
            return a.price - b.price
          case 'price-desc':
            return b.price - a.price
          case 'trending':
            // Pour l'instant, tri par nom (à adapter selon vos besoins)
            return a.name.localeCompare(b.name)
          default:
            return 0
        }
      })

      return filteredProducts
    },
    [products, searchTerm, selectedBrand, selectedRange, selectedTags, sortBy]
  )

  // Pagination
  const totalPages = Math.ceil(filtered.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = filtered.slice(startIndex, endIndex)

  // Préparer les données pour le composant Filters
  const availableCategories = itemsByType['category'] || []
  const availableNeeds = itemsByType['need'] || []
  const availableSkinTypes = itemsByType['skin_type'] || []
  const availableIngredients = itemsByType['ingredient'] || []

  return (
    <div className="catalogue max-w-7xl mx-auto">
      {/* Ligne 1: Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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

      {/* Ligne 2: Bouton trier à droite */}
      <div className="mb-6 flex justify-end">
        <SortSelector sort={sortBy} onChange={setSortBy} />
      </div>

      {/* Ligne 3: Filtres à gauche et produits à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Colonne des filtres */}
        <div className="lg:col-span-1">
          <Filters
            availableBrands={brands}
            rangesByBrand={rangesByBrand}
            availableCategories={availableCategories}
            availableNeeds={availableNeeds}
            availableSkinTypes={availableSkinTypes}
            availableIngredients={availableIngredients}
            selectedBrand={selectedBrand}
            selectedRange={selectedRange}
            selectedCategories={selectedTags['category'] || new Set()}
            selectedNeeds={selectedTags['need'] || new Set()}
            selectedSkinTypes={selectedTags['skin_type'] || new Set()}
            selectedIngredients={selectedTags['ingredient'] || new Set()}
            onBrandChange={handleBrandChange}
            onRangeChange={setSelectedRange}
            onCategoryToggle={(cat) => handleTagToggle('category', cat)}
            onNeedToggle={(need) => handleTagToggle('need', need)}
            onSkinTypeToggle={(skinType) => handleTagToggle('skin_type', skinType)}
            onIngredientToggle={(ingredient) => handleTagToggle('ingredient', ingredient)}
            onClearFilters={clearAllFilters}
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
              Aucun produit trouvé avec les critères sélectionnés.
            </div>
          )}
        </div>
      </div>

      {/* Ligne 4: Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Précédent
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 border rounded-lg ${
                currentPage === page
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
