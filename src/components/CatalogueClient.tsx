'use client'
import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
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
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string,string[]>>({})
  const [sort, setSort] = useState('az')  // <-- add sort state

  const processed = useMemo(() => {
    let list = initialProducts
      .filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      )
      .filter(p =>
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
    // Apply sorting based on `sort`
    return list.sort((a, b) => {
      switch (sort) {
        case 'az':          return a.name.localeCompare(b.name)
        case 'za':          return b.name.localeCompare(a.name)
        case 'price-asc':   return a.price - b.price
        case 'price-desc':  return b.price - a.price
        case 'trending':    return b.product_tags.length - a.product_tags.length
        default:            return 0
      }
    })
  }, [initialProducts, search, filters, sort])  // <-- include sort

  return (
    <div className="flex flex-col gap-6 items-start">
      <div className="flex justify-center w-full mb-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border rounded-lg focus:outline-none"
          />
        </div>
      </div>
      <div className="flex gap-6 items-start">
        <Filters itemsByType={itemsByType} onChange={setFilters} />
        <section className="flex-1">
          <div className="flex justify-end mb-4">
            <SortSelector sort={sort} onChange={setSort} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {processed.map(p => (
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
    </div>
  )
}
