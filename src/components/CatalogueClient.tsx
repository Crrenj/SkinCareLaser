'use client'
import { useState, useMemo } from 'react'
import Filters from './Filters'
import SortSelector from './SortSelector'
import ProductCard from './ProductCard'

type Tag = { name: string; tag_type: string }
type Product = {
  id: string
  name: string
  price: number
  currency: string
  product_images: { url: string; alt: string }[]
  product_tags: { tag: Tag[] }[]
}

type Props = {
  initialProducts: Product[]
  itemsByType: Record<string,string[]>
}

export default function CatalogueClient({ initialProducts, itemsByType }: Props) {
  const [filters, setFilters] = useState<Record<string,string[]>>({})

  const filtered = useMemo(() => {
    return initialProducts.filter(p =>
      Object.entries(filters).every(([key, vals]) => {
        if (!vals.length) return true
        const tags = p.product_tags
          .map(pt => pt.tag)
          .flat()
          .filter(t => t.tag_type === key)
          .map(t => t.name)
        return vals.some(v => tags.includes(v))
      })
    )
  }, [initialProducts, filters])

  return (
    <div className="flex gap-6 items-start">
      <Filters itemsByType={itemsByType} onChange={setFilters} />
      <section className="flex-1">
        <div className="flex justify-end mb-4">
          <SortSelector />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              product={{
                id: p.id,
                name: p.name,
                price: p.price,
                currency: p.currency,
                images: p.product_images
              }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
