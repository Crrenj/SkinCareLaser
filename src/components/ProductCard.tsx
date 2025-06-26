import Image from 'next/image'
import { PlusCircle } from 'lucide-react'

type ProductImage = { url: string; alt: string }
type Product = {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  images?: ProductImage[]
  brand?: string
  range?: string
}

type Props = { product: Product }

export default function ProductCard({ product }: Props) {
  const price = product.price.toFixed(2)
  return (
    <article
      className="rounded-lg p-3 bg-white flex flex-col h-full
                 shadow-md hover:shadow-lg transition-shadow"
    >
      <Image
        src={product.images?.[0]?.url ?? '/placeholder.png'}
        alt={product.images?.[0]?.alt ?? product.name}
        width={400}
        height={400}
        className="w-full aspect-square object-cover rounded"
      />
      {/* affichage de la marque et de la gamme */}
      {product.brand && (
        <p className="mt-2 text-sm text-gray-500">{product.brand}</p>
      )}
      {product.range && (
        <p className="text-xs uppercase text-gray-500">{product.range}</p>
      )}
      <h2 className="mt-2 text-xl font-semibold text-center">{product.name}</h2>
      {product.description && (
        <p className="mt-4 mb-4 text-sm text-gray-600 text-center">
          {product.description}
        </p>
      )}
      <div className="mt-auto flex justify-between items-center">
        <button
          type="button"
          aria-label="Ajouter au panier"
          className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <PlusCircle size={24} />
        </button>
        <p className="text-lg font-bold">{price} {product.currency}</p>
      </div>
    </article>
  )
}
