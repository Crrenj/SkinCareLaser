import React, { FC } from 'react'

interface FiltersProps {
  availableBrands: string[]
  availableRanges: string[]
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
}

const Filters: FC<FiltersProps> = ({
  availableBrands,
  availableRanges,
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
}) => (
  <div className="filters p-4 grid gap-4 md:grid-cols-3">
    {/* Marque */}
    <div>
      <label>Marque</label>
      <select value={selectedBrand} onChange={e => onBrandChange(e.target.value)}>
        <option value="">Toutes</option>
        {availableBrands.map(b => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
    </div>

    {/* Gamme */}
    <div>
      <label>Gamme</label>
      <select value={selectedRange} onChange={e => onRangeChange(e.target.value)}>
        <option value="">Toutes</option>
        {availableRanges.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>

    {/* Catégories */}
    <div>
      <label>Catégories</label>
      <div className="flex flex-wrap gap-2 mt-1">
        {availableCategories.map(cat => (
          <button
            key={cat}
            type="button"
            className={`px-2 py-1 border rounded ${
              selectedCategories.has(cat) ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
            onClick={() => onCategoryToggle(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>

    {/* Besoins */}
    <div>
      <label>Besoins</label>
      <div className="flex flex-wrap gap-2 mt-1">
        {availableNeeds.map(n => (
          <button
            key={n}
            type="button"
            className={`px-2 py-1 border rounded ${
              selectedNeeds.has(n) ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
            onClick={() => onNeedToggle(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>

    {/* Types de peau */}
    <div>
      <label>Types de peau</label>
      <div className="flex flex-wrap gap-2 mt-1">
        {availableSkinTypes.map(st => (
          <button
            key={st}
            type="button"
            className={`px-2 py-1 border rounded ${
              selectedSkinTypes.has(st) ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
            onClick={() => onSkinTypeToggle(st)}
          >
            {st}
          </button>
        ))}
      </div>
    </div>

    {/* Ingrédients */}
    <div>
      <label>Ingrédients</label>
      <div className="flex flex-wrap gap-2 mt-1">
        {availableIngredients.map(ing => (
          <button
            key={ing}
            type="button"
            className={`px-2 py-1 border rounded ${
              selectedIngredients.has(ing) ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
            onClick={() => onIngredientToggle(ing)}
          >
            {ing}
          </button>
        ))}
      </div>
    </div>
  </div>
)

export default Filters
