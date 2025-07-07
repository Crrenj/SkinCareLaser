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
  itemsByType: Record<string, string[]> // Données dynamiques des tags
  
  // Selected filters
  selectedBrands: Set<string>
  selectedRanges: Set<string>
  selectedTags: Record<string, Set<string>> // Sélections dynamiques des tags
  
  // Handlers
  onBrandToggle: (brand: string) => void
  onRangeToggle: (range: string) => void
  onBrandSelectAll: (brand: string, select: boolean) => void
  onTagToggle: (tagType: string, tagName: string) => void // Handler générique pour tous les tags
  onClearFilters: () => void
  
  // Product counts per filter (optional)
  productCounts?: {
    brands?: Record<string, number>
    ranges?: Record<string, number>
    tags?: Record<string, Record<string, number>> // tags[tagType][tagName] = count
  }
}

// Mapping des noms d'affichage pour les types de tags
const TAG_TYPE_LABELS: Record<string, string> = {
  'categories': 'CATÉGORIES',
  'besoins': 'BESOINS',
  'types-peau': 'TYPE DE PEAU',
  'ingredients': 'INGRÉDIENTS',
  // Fallback pour d'autres types
}

const Filters: FC<FiltersProps> = ({
  sortOption,
  onSortChange,
  availableBrands,
  rangesByBrand,
  itemsByType,
  selectedBrands,
  selectedRanges,
  selectedTags,
  onBrandToggle,
  onRangeToggle,
  onBrandSelectAll,
  onTagToggle,
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
        
        {/* Filtres dynamiques par type de tag */}
        {Object.entries(itemsByType).map(([tagType, tagNames]) => {
          if (tagNames.length === 0) return null
          
          const sectionKey = `tags-${tagType}`
          const displayLabel = TAG_TYPE_LABELS[tagType] || tagType.toUpperCase()
          const selectedTagsForType = selectedTags[tagType] || new Set()
          
          return (
            <div key={tagType} className="border-t border-gray-300">
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full flex items-center justify-between py-4 text-left focus:outline-none"
              >
                <span className="text-sm font-medium tracking-wide">{displayLabel}</span>
                {expandedSections.has(sectionKey) ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                )}
              </button>
              
              {expandedSections.has(sectionKey) && (
                <div className="pb-4 space-y-3">
                  {tagNames.map((tagName) => (
                    <label key={tagName} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedTagsForType.has(tagName)}
                        onChange={() => onTagToggle(tagType, tagName)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded-sm transition-all ${
                        selectedTagsForType.has(tagName)
                          ? 'bg-black border-black'
                          : 'bg-white border-gray-400 group-hover:border-gray-600'
                      }`}>
                        {selectedTagsForType.has(tagName) && (
                          <svg className="w-3 h-3 m-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 uppercase tracking-wide">
                        {tagName}
                        {productCounts?.tags?.[tagType]?.[tagName] !== undefined && 
                          <span className="text-gray-500"> ({productCounts.tags[tagType][tagName]})</span>
                        }
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        
        <div className="border-t border-gray-300"></div>
      </div>
    </div>
  )
}

export default Filters 