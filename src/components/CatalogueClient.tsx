'use client'
import React, { useState, useMemo } from 'react'
import ProductCard from '@/components/ProductCard'

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

  // application des filtres
  const filtered = useMemo(
    () =>
      products.filter(p => {
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
      }),
    [products, selectedBrand, selectedRange, selectedTags]
  )

  return (
    <div className="catalogue">
      <div className="filters p-4 grid gap-4 md:grid-cols-3">
        <div>
          <label>Marque</label>
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
          >
            <option value="">Toutes</option>
            {brands.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Gamme</label>
          <select
            value={selectedRange}
            onChange={e => setSelectedRange(e.target.value)}
          >
            <option value="">Toutes</option>
            {ranges.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        {/* filtres par facette */}
        {Object.entries(itemsByType).map(([cat, tags]) => (
          <div key={cat}>
            <label>{cat}</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`px-2 py-1 border rounded ${
                    selectedTags[cat].has(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white'
                  }`}
                  onClick={() => handleTagToggle(cat, tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="product-grid grid gap-4 p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
