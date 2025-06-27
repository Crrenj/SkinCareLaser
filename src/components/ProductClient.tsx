'use client'

import React from 'react'

export type MappedProduct = {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  images: { url: string; alt: string | null }[]
  brand: string
  range: string
  tagsByCategory: Record<string, string[]>
}

interface ProductClientProps {
  product: MappedProduct
  similarProducts: MappedProduct[]
}

export default function ProductClient({
  product,
  similarProducts,
}: ProductClientProps) {
  return (
    <div>
      {/* Détails du produit */}
      <section>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p>{product.description}</p>
        <p>
          Prix : {product.price.toFixed(2)} {product.currency.toUpperCase()}
        </p>
        <div className="flex space-x-2">
          {product.images.map((img, i) => (
            <img key={i} src={img.url} alt={img.alt || product.name} className="w-24 h-24 object-cover" />
          ))}
        </div>
        <div className="mt-2">
          {Object.entries(product.tagsByCategory).map(([cat, tags]) => (
            <p key={cat}>
              <strong>{cat} :</strong> {tags.join(', ')}
            </p>
          ))}
        </div>
      </section>

      {/* Produits similaires */}
      {similarProducts.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Produits similaires</h2>
          <ul className="grid grid-cols-2 gap-4 mt-4">
            {similarProducts.map((p) => (
              <li key={p.id} className="border p-2">
                <img
                  src={p.images[0]?.url}
                  alt={p.images[0]?.alt || p.name}
                  className="w-full h-32 object-cover"
                />
                <h3 className="mt-2 font-medium">{p.name}</h3>
                <p>
                  {p.price.toFixed(2)} {p.currency.toUpperCase()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}