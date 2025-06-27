'use client'

import React, { useState } from 'react'
import ProductCard from '@/components/ProductCard'
import { useCart } from '@/contexts/CartContext'

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
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()

  // Vérification des données
  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Produit non trouvé</p>
      </div>
    )
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
  }

  const totalPrice = product.price * quantity

  return (
    <div className="max-w-6xl mx-auto">
      {/* Carte principale du produit */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne gauche - Images */}
          <div className="space-y-4">
            {product.images && product.images.length > 0 ? (
              <div className="space-y-4">
                {/* Image principale */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <img 
                    src={product.images[0].url} 
                    alt={product.images[0].alt || product.name} 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Galerie d'images secondaires */}
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.slice(1).map((img, i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <img 
                          src={img.url} 
                          alt={img.alt || product.name} 
                          className="w-full h-full object-contain cursor-pointer hover:opacity-75 transition-opacity" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Aucune image disponible</p>
              </div>
            )}
          </div>

          {/* Colonne droite - Informations produit */}
          <div className="space-y-6">
            {/* Marque et gamme */}
            <div className="space-y-2">
              {product.brand && (
                <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                  {product.brand}
                </p>
              )}
              {product.range && (
                <p className="text-sm text-gray-600">
                  Gamme {product.range}
                </p>
              )}
            </div>

            {/* Nom du produit */}
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Prix */}
            <div className="text-3xl font-bold text-blue-600">
              {product.price.toFixed(2)} {product.currency.toUpperCase()}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Tags par catégorie */}
            {Object.entries(product.tagsByCategory).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Caractéristiques</h3>
                {Object.entries(product.tagsByCategory).map(([category, tags]) => (
                  <div key={category}>
                    <span className="text-sm font-medium text-gray-600 capitalize block mb-2">
                      {category.replace('_', ' ')}:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Section quantité */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Quantité</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= 99}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Prix total: <span className="font-semibold text-blue-600">{totalPrice.toFixed(2)} {product.currency.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Bouton d'action */}
            <div className="pt-4">
              <button 
                onClick={handleAddToCart}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
              >
                Ajouter au panier ({quantity})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Produits similaires */}
      {similarProducts && similarProducts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Produits similaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProducts.map((p) => (
              <ProductCard 
                key={p.id} 
                product={{
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  price: p.price,
                  currency: p.currency,
                  images: p.images.map(img => ({
                    url: img.url,
                    alt: img.alt || ''
                  })),
                  brand: p.brand,
                  range: p.range
                }} 
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}