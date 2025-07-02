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
  selectedBrands: Set<string>
  selectedRanges: Set<string>
  selectedCategories: Set<string>
  selectedNeeds: Set<string>
  selectedSkinTypes: Set<string>
  selectedIngredients: Set<string>
  
  // Handlers
  onBrandToggle: (brand: string) => void
  onRangeToggle: (range: string) => void
  onBrandSelectAll: (brand: string, select: boolean) => void
  onCategoryToggle: (category: string) => void
  onNeedToggle: (need: string) => void
  onSkinTypeToggle: (skinType: string) => void
  onIngredientToggle: (ingredient: string) => void
  onClearFilters: () => void
  
  // Product counts per filter (optional)
  productCounts?: {
    brands?: Record<string, number>
    ranges?: Record<string, number>
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
  selectedBrands,
  selectedRanges,
  selectedCategories,
  selectedNeeds,
  selectedSkinTypes,
  selectedIngredients,
  onBrandToggle,
  onRangeToggle,
  onBrandSelectAll,
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
    { value: 'bestsellers', label: 'MEILLEURES VENTES' },
    { value: 'az', label: 'ALPHABÉTIQUE, DE A À Z' },
    { value: 'za', label: 'ALPHABÉTIQUE, DE Z À A' },
    { value: 'price-asc', label: 'PRIX: FAIBLE À ÉLEVÉ' },
    { value: 'price-desc', label: 'PRIX: ÉLEVÉ À FAIBLE' },
  ]
  
  return (
    <div className="filters w-full max-w-sm bg-gray-50 p-6 rounded-lg">
      {/* TRIER PAR */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('sort')}
          className="w-full flex items-center justify-between py-4 border-b border-gray-300 text-left focus:outline-none"
        >
          <span className="text-base font-semibold tracking-wide">TRIER PAR</span>
          {expandedSections.has('sort') ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
        
        {expandedSections.has('sort') && (
          <div className="mt-4 space-y-3">
            {sortOptions.map((option) => (
              <label key={option.value} className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={sortOption === option.value}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded-sm transition-all ${
                  sortOption === option.value
                    ? 'bg-black border-black'
                    : 'bg-white border-gray-400 group-hover:border-gray-600'
                }`}>
                  {sortOption === option.value && (
                    <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      
      {/* FILTRER PAR */}
      <div className="mb-6">
        <div className="flex items-center justify-between py-4">
          <span className="text-base font-semibold tracking-wide">FILTRER PAR</span>
          <button
            onClick={onClearFilters}
            className="text-sm font-medium underline hover:no-underline focus:outline-none"
          >
            RÉINITIALISER
          </button>
        </div>
        
        {/* Marques */}
        {availableBrands.length > 0 && (
          <div className="border-t border-gray-300">
            <button
              onClick={() => toggleSection('brands')}
              className="w-full flex items-center justify-between py-4 text-left focus:outline-none"
            >
              <span className="text-sm font-medium tracking-wide">MARQUES</span>
              {expandedSections.has('brands') ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
            
            {expandedSections.has('brands') && (
              <div className="pb-4 space-y-3">
                {availableBrands.map((brand) => {
                  const brandRanges = rangesByBrand[brand] || []
                  const selectedBrandRanges = brandRanges.filter(range => selectedRanges.has(range))
                  const allRangesSelected = brandRanges.length > 0 && 
                    selectedBrandRanges.length === brandRanges.length
                  const someRangesSelected = selectedBrandRanges.length > 0 && 
                    selectedBrandRanges.length < brandRanges.length
                  
                  return (
                    <div key={brand} className="space-y-2">
                      {/* Marque */}
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedBrands.has(brand)}
                          onChange={() => {
                            if (selectedBrands.has(brand) || allRangesSelected) {
                              onBrandToggle(brand)
                              onBrandSelectAll(brand, false)
                            } else {
                              onBrandToggle(brand)
                              onBrandSelectAll(brand, true)
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded-sm transition-all ${
                          selectedBrands.has(brand) || allRangesSelected
                            ? 'bg-black border-black'
                            : someRangesSelected
                            ? 'bg-gray-500 border-gray-500'
                            : 'bg-white border-gray-400 group-hover:border-gray-600'
                        }`}>
                          {(selectedBrands.has(brand) || allRangesSelected) && (
                            <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {someRangesSelected && !selectedBrands.has(brand) && !allRangesSelected && (
                            <div className="w-full h-0.5 bg-white"></div>
                          )}
                        </div>
                        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 uppercase tracking-wide">
                          {brand}
                          {productCounts?.brands?.[brand] !== undefined && 
                            <span className="text-gray-500"> ({productCounts.brands[brand]})</span>
                          }
                        </span>
                      </label>
                      
                      {/* Gammes */}
                      {brandRanges.length > 0 && (
                        <div className="ml-8 space-y-2">
                          {brandRanges.map((range) => (
                            <label key={range} className="flex items-center cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={selectedRanges.has(range)}
                                onChange={() => onRangeToggle(range)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 border-2 rounded-sm transition-all ${
                                selectedRanges.has(range)
                                  ? 'bg-black border-black'
                                  : 'bg-white border-gray-400 group-hover:border-gray-600'
                              }`}>
                                {selectedRanges.has(range) && (
                                  <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 uppercase tracking-wide">
                                {range}
                                {productCounts?.ranges?.[range] !== undefined && 
                                  <span className="text-gray-500"> ({productCounts.ranges[range]})</span>
                                }
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Catégories */}
        {availableCategories.length > 0 && (
          <div className="border-t border-gray-300">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between py-4 text-left focus:outline-none"
            >
              <span className="text-sm font-medium tracking-wide">CATÉGORIES</span>
              {expandedSections.has('categories') ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
            
            {expandedSections.has('categories') && (
              <div className="pb-4 space-y-3">
                {availableCategories.map((category) => (
                  <label key={category} className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(category)}
                      onChange={() => onCategoryToggle(category)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded-sm transition-all ${
                      selectedCategories.has(category)
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-400 group-hover:border-gray-600'
                    }`}>
                      {selectedCategories.has(category) && (
                        <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 uppercase tracking-wide">
                      {category}
                      {productCounts?.categories?.[category] !== undefined && 
                        <span className="text-gray-500"> ({productCounts.categories[category]})</span>
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
              className="w-full flex items-center justify-between py-4 text-left focus:outline-none"
            >
              <span className="text-sm font-medium tracking-wide">BESOINS</span>
              {expandedSections.has('needs') ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
            
            {expandedSections.has('needs') && (
              <div className="pb-4 space-y-3">
                {availableNeeds.map((need) => (
                  <label key={need} className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedNeeds.has(need)}
                      onChange={() => onNeedToggle(need)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded-sm transition-all ${
                      selectedNeeds.has(need)
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-400 group-hover:border-gray-600'
                    }`}>
                      {selectedNeeds.has(need) && (
                        <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 uppercase tracking-wide">
                      {need}
                      {productCounts?.needs?.[need] !== undefined && 
                        <span className="text-gray-500"> ({productCounts.needs[need]})</span>
                      }
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Type de peau */}
        {availableSkinTypes.length > 0 && (
          <div className="border-t border-gray-300">
            <button
              onClick={() => toggleSection('skinTypes')}
              className="w-full flex items-center justify-between py-4 text-left focus:outline-none"
            >
              <span className="text-sm font-medium tracking-wide">TYPE DE PEAU</span>
              {expandedSections.has('skinTypes') ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
            
            {expandedSections.has('skinTypes') && (
              <div className="pb-4 space-y-3">
                {availableSkinTypes.map((skinType) => (
                  <label key={skinType} className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedSkinTypes.has(skinType)}
                      onChange={() => onSkinTypeToggle(skinType)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded-sm transition-all ${
                      selectedSkinTypes.has(skinType)
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-400 group-hover:border-gray-600'
                    }`}>
                      {selectedSkinTypes.has(skinType) && (
                        <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 uppercase tracking-wide">
                      {skinType}
                      {productCounts?.skinTypes?.[skinType] !== undefined && 
                        <span className="text-gray-500"> ({productCounts.skinTypes[skinType]})</span>
                      }
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Ingrédients */}
        {availableIngredients.length > 0 && (
          <div className="border-t border-gray-300">
            <button
              onClick={() => toggleSection('ingredients')}
              className="w-full flex items-center justify-between py-4 text-left focus:outline-none"
            >
              <span className="text-sm font-medium tracking-wide">INGRÉDIENTS</span>
              {expandedSections.has('ingredients') ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
            
            {expandedSections.has('ingredients') && (
              <div className="pb-4 space-y-3">
                {availableIngredients.map((ingredient) => (
                  <label key={ingredient} className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedIngredients.has(ingredient)}
                      onChange={() => onIngredientToggle(ingredient)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded-sm transition-all ${
                      selectedIngredients.has(ingredient)
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-400 group-hover:border-gray-600'
                    }`}>
                      {selectedIngredients.has(ingredient) && (
                        <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 uppercase tracking-wide">
                      {ingredient}
                      {productCounts?.ingredients?.[ingredient] !== undefined && 
                        <span className="text-gray-500"> ({productCounts.ingredients[ingredient]})</span>
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