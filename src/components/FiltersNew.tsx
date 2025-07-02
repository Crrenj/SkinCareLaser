'use client'
import React, { FC, useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface FiltersProps {
  // Sort
  sortOption: string
  onSortChange: (sort: string) => void
  
  // Filter options
  availableBrands: string[]
  rangesByBrand: Record<string, string[]>
  availableCategories: string[]
  availableNeeds: string[]
  availableSkinTypes: string[]
  availableIngredients: string[]
  
  // Selected filters
  selectedBrand: string
  selectedRange: string
  selectedCategories: Set<string>
  selectedNeeds: Set<string>
  selectedSkinTypes: Set<string>
  selectedIngredients: Set<string>
  
  // Handlers
  onBrandChange: (brand: string) => void
  onRangeChange: (range: string) => void
  onCategoryToggle: (category: string) => void
  onNeedToggle: (need: string) => void
  onSkinTypeToggle: (skinType: string) => void
  onIngredientToggle: (ingredient: string) => void
  onClearFilters: () => void
  
  // Product counts per filter (optional)
  productCounts?: {
    needs?: Record<string, number>
    skinTypes?: Record<string, number>
    categories?: Record<string, number>
    ingredients?: Record<string, number>
  }
}

const Filters: FC<FiltersProps> = ({
  sortOption,
  onSortChange,
  availableBrands,
  rangesByBrand,
  availableCategories,
  availableNeeds,
  availableSkinTypes,
  availableIngredients,
  selectedBrand,
  selectedRange,
  selectedCategories,
  selectedNeeds,
  selectedSkinTypes,
  selectedIngredients,
  onBrandChange,
  onRangeChange,
  onCategoryToggle,
  onNeedToggle,
  onSkinTypeToggle,
  onIngredientToggle,
  onClearFilters,
  productCounts,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sort']))
  
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }
  
  const sortOptions = [
    { value: 'featured', label: 'SÉLECTIONNÉ POUR VOUS' },
    { value: 'bestsellers', label: 'MEILLEURES VENTES' },
    { value: 'az', label: 'ALPHABÉTIQUE, DE A À Z' },
    { value: 'za', label: 'ALPHABÉTIQUE, DE Z À A' },
    { value: 'price-asc', label: 'PRIX: FAIBLE À ÉLEVÉ' },
    { value: 'price-desc', label: 'PRIX: ÉLEVÉ À FAIBLE' },
  ]
  
  return (
    <div className="filters w-full max-w-sm bg-gray-50 p-6">
      {/* TRIER PAR */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('sort')}
          className="w-full flex items-center justify-between py-4 border-b border-gray-300 text-left"
        >
          <span className="text-base font-medium">TRIER PAR</span>
          {expandedSections.has('sort') ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
        
        {expandedSections.has('sort') && (
          <div className="mt-4 space-y-3">
            {sortOptions.map((option) => (
              <label key={option.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={sortOption === option.value}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded ${
                  sortOption === option.value
                    ? 'bg-black border-black'
                    : 'bg-white border-gray-400'
                }`}>
                  {sortOption === option.value && (
                    <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="ml-3 text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      
      {/* FILTRER PAR */}
      <div className="mb-6">
        <div className="flex items-center justify-between py-4">
          <span className="text-base font-medium">FILTRER PAR</span>
          <button
            onClick={onClearFilters}
            className="text-sm underline hover:no-underline"
          >
            RÉINITIALISER
          </button>
        </div>
        
        {/* Type de peau */}
        {availableSkinTypes.length > 0 && (
          <div className="border-t border-gray-300">
            <button
              onClick={() => toggleSection('skinTypes')}
              className="w-full flex items-center justify-between py-4 text-left"
            >
              <span className="text-sm font-medium">TYPE DE PEAU</span>
              {expandedSections.has('skinTypes') ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
            
            {expandedSections.has('skinTypes') && (
              <div className="pb-4 space-y-3">
                {availableSkinTypes.map((skinType) => (
                  <label key={skinType} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSkinTypes.has(skinType)}
                      onChange={() => onSkinTypeToggle(skinType)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded ${
                      selectedSkinTypes.has(skinType)
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-400'
                    }`}>
                      {selectedSkinTypes.has(skinType) && (
                        <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="ml-3 text-sm uppercase">
                      {skinType}
                      {productCounts?.skinTypes?.[skinType] !== undefined && 
                        ` (${productCounts.skinTypes[skinType]})`
                      }
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Besoins */}
        {availableNeeds.length > 0 && (
          <div className="border-t border-gray-300">
            <button
              onClick={() => toggleSection('needs')}
              className="w-full flex items-center justify-between py-4 text-left"
            >
              <span className="text-sm font-medium">BESOINS</span>
              {expandedSections.has('needs') ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
            
            {expandedSections.has('needs') && (
              <div className="pb-4 space-y-3">
                {availableNeeds.map((need) => (
                  <label key={need} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedNeeds.has(need)}
                      onChange={() => onNeedToggle(need)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded ${
                      selectedNeeds.has(need)
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-400'
                    }`}>
                      {selectedNeeds.has(need) && (
                        <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="ml-3 text-sm uppercase">
                      {need}
                      {productCounts?.needs?.[need] !== undefined && 
                        ` (${productCounts.needs[need]})`
                      }
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Catégories */}
        {availableCategories.length > 0 && (
          <div className="border-t border-gray-300">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between py-4 text-left"
            >
              <span className="text-sm font-medium">CATÉGORIES</span>
              {expandedSections.has('categories') ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
            
            {expandedSections.has('categories') && (
              <div className="pb-4 space-y-3">
                {availableCategories.map((category) => (
                  <label key={category} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(category)}
                      onChange={() => onCategoryToggle(category)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded ${
                      selectedCategories.has(category)
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-400'
                    }`}>
                      {selectedCategories.has(category) && (
                        <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="ml-3 text-sm uppercase">
                      {category}
                      {productCounts?.categories?.[category] !== undefined && 
                        ` (${productCounts.categories[category]})`
                      }
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Marques */}
        {availableBrands.length > 0 && (
          <div className="border-t border-gray-300">
            <button
              onClick={() => toggleSection('brands')}
              className="w-full flex items-center justify-between py-4 text-left"
            >
              <span className="text-sm font-medium">MARQUES</span>
              {expandedSections.has('brands') ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
            
            {expandedSections.has('brands') && (
              <div className="pb-4 space-y-3">
                <select 
                  value={selectedBrand} 
                  onChange={e => onBrandChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black text-sm"
                >
                  <option value="">Toutes les marques</option>
                  {availableBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                
                {selectedBrand && rangesByBrand[selectedBrand] && rangesByBrand[selectedBrand].length > 0 && (
                  <select
                    value={selectedRange}
                    onChange={e => onRangeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black text-sm mt-2"
                  >
                    <option value="">Toutes les gammes</option>
                    {rangesByBrand[selectedBrand].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Ingrédients */}
        {availableIngredients.length > 0 && (
          <div className="border-t border-gray-300">
            <button
              onClick={() => toggleSection('ingredients')}
              className="w-full flex items-center justify-between py-4 text-left"
            >
              <span className="text-sm font-medium">INGRÉDIENTS</span>
              {expandedSections.has('ingredients') ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
            
            {expandedSections.has('ingredients') && (
              <div className="pb-4 space-y-3">
                {availableIngredients.map((ingredient) => (
                  <label key={ingredient} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIngredients.has(ingredient)}
                      onChange={() => onIngredientToggle(ingredient)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded ${
                      selectedIngredients.has(ingredient)
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-400'
                    }`}>
                      {selectedIngredients.has(ingredient) && (
                        <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="ml-3 text-sm uppercase">
                      {ingredient}
                      {productCounts?.ingredients?.[ingredient] !== undefined && 
                        ` (${productCounts.ingredients[ingredient]})`
                      }
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="border-t border-gray-300"></div>
      </div>
    </div>
  )
}

export default Filters 