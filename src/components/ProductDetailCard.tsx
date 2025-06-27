'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { PlusCircle } from 'lucide-react'

type ProductImage = { url: string; alt: string }
type Product = {
  id: string
  name: string
  description?: string
  price: number
  currency: string
}
interface Props {
  product: Product
  images?: ProductImage[]
  brand?: string
  range?: string
  tagsByType: {
    category: string[]
    need: string[]
    skin_type: string[]
    ingredient: string[]
  }
}

const SECTION_TITLES: Record<string,string> = {
  category: 'Types',
  skin_type: 'Type de peau',
  need: 'Besoins',
  ingredient: 'Ingrédients'
}

export default function ProductDetailCard({
  product,
  images,
  brand,
  range,
  tagsByType,
}: Props) {
  const [quantity, setQuantity] = useState(1)
  const price = product.price.toFixed(2)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-white rounded-lg shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Image */}
        <div className="flex justify-center items-center md:col-span-2">
          <div className="relative aspect-square w-full md:w-4/5 max-w-[500px] mx-auto rounded-2xl shadow-lg ring-1 ring-slate-200/50 overflow-hidden">
            <Image
              src={images?.[0]?.url || '/placeholder.png'}
              alt={`Image de ${product.name}`}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
        </div>

        {/* Contenu */}
        <div className="flex flex-col h-full md:col-span-3">
          {/* Marques + Gamme sans titre */}
          <div className="mb-6 flex flex-wrap gap-2">
            {brand && (
              <span className="inline-block bg-slate-100 text-slate-600 uppercase text-xs px-2 py-1 rounded-full">
                {brand}
              </span>
            )}
            {range && (
              <span className="inline-block bg-slate-100 text-slate-600 uppercase text-xs px-2 py-1 rounded-full">
                {range}
              </span>
            )}
          </div>

          {/* Nom et Description */}
          <h1 className="font-bold text-3xl md:text-4xl">{product.name}</h1>
          <p className="text-slate-600 leading-relaxed mt-4">
            {product.description}
          </p>

          {/* Séparation en 2 colonnes */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* colonne gauche : sections tags groupées */}
            <div className="space-y-6">
              {Object.entries(tagsByType).map(([type, list]) => (
                <div key={type}>
                  <h4 className="font-semibold uppercase mb-2">
                    {SECTION_TITLES[type] ?? type.replace('_', ' ')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {list.map(tag => (
                      <span
                        key={tag}
                        className="bg-slate-100 text-sm px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* colonne droite : prix + quantité + bouton */}
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-2xl font-semibold text-primary-700">
                {price} {product.currency}
              </p>
              {/* Quantité */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 transition rounded-full grid place-items-center"
                >
                  −
                </button>
                <span className="text-lg font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 transition rounded-full grid place-items-center"
                >
                  +
                </button>
              </div>
              <button
                aria-label="Ajouter au panier"
                className="group bg-blue-500 text-white px-6 py-3 rounded-md w-full md:w-auto flex items-center justify-center transition-colors hover:bg-blue-600"
              >
                <PlusCircle
                  size={20}
                  className="mr-2 transition-transform group-hover:rotate-90"
                />
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
