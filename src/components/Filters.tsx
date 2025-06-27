import React, { FC } from 'react'

interface FiltersProps {
  availableBrands: string[]
  rangesByBrand: Record<string, string[]>
  availableCategories: string[]
  availableNeeds: string[]
  availableSkinTypes: string[]
  availableIngredients: string[]
  selectedBrand: string
  selectedRange: string
  selectedCategories: Set<string>
  selectedNeeds: Set<string>
  selectedSkinTypes: Set<string>
  selectedIngredients: Set<string>
  onBrandChange: (brand: string) => void
  onRangeChange: (range: string) => void
  onCategoryToggle: (category: string) => void
  onNeedToggle: (need: string) => void
  onSkinTypeToggle: (skinType: string) => void
  onIngredientToggle: (ingredient: string) => void
  onClearFilters: () => void
}

const Filters: FC<FiltersProps> = ({
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
}) => (
  <div className="filters space-y-6 p-4 bg-gray-50 rounded-lg">
    {/* Bouton clear filters */}
    <div className="flex justify-between items-center mb-2">
      <span className="font-semibold text-lg">Filtres</span>
      <button
        type="button"
        onClick={onClearFilters}
        className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
      >
        Effacer les filtres
      </button>
    </div>

    {/* Marque */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
      <select 
        value={selectedBrand} 
        onChange={e => onBrandChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Toutes les marques</option>
        {availableBrands.map(b => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
    </div>

    {/* Gamme (dépend de la marque sélectionnée) */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Gamme</label>
      <select
        value={selectedRange}
        onChange={e => onRangeChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={!selectedBrand || !rangesByBrand[selectedBrand] || rangesByBrand[selectedBrand].length === 0}
      >
        <option value="">{selectedBrand ? 'Toutes les gammes' : 'Sélectionnez une marque'}</option>
        {selectedBrand && rangesByBrand[selectedBrand]?.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>

    {/* Catégories */}
    {availableCategories.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Catégories</label>
        <div className="flex flex-wrap gap-2">
          {availableCategories.map(cat => (
            <button
              key={cat}
              type="button"
              className={`px-3 py-1 text-sm border rounded-full transition-colors ${
                selectedCategories.has(cat) 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onCategoryToggle(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Besoins */}
    {availableNeeds.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Besoins</label>
        <div className="flex flex-wrap gap-2">
          {availableNeeds.map(n => (
            <button
              key={n}
              type="button"
              className={`px-3 py-1 text-sm border rounded-full transition-colors ${
                selectedNeeds.has(n) 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onNeedToggle(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Types de peau */}
    {availableSkinTypes.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Types de peau</label>
        <div className="flex flex-wrap gap-2">
          {availableSkinTypes.map(st => (
            <button
              key={st}
              type="button"
              className={`px-3 py-1 text-sm border rounded-full transition-colors ${
                selectedSkinTypes.has(st) 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onSkinTypeToggle(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Ingrédients */}
    {availableIngredients.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ingrédients</label>
        <div className="flex flex-wrap gap-2">
          {availableIngredients.map(ing => (
            <button
              key={ing}
              type="button"
              className={`px-3 py-1 text-sm border rounded-full transition-colors ${
                selectedIngredients.has(ing) 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onIngredientToggle(ing)}
            >
              {ing}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
)

export default Filters
