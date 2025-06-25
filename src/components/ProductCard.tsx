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
}

type Props = { product: Product }

export default function ProductCard({ product }: Props) {
  const price = product.price.toFixed(2)
  return (
    <article className="border rounded-lg p-3 bg-white flex flex-col h-full">
      <Image
        src={product.images?.[0]?.url ?? '/placeholder.png'}
        alt={product.images?.[0]?.alt ?? product.name}
        width={400}
        height={400}
        className="w-full aspect-square object-cover rounded"
      />
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
          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
        >
          <PlusCircle size={24} />
        </button>
        <p className="text-lg font-bold">{price} {product.currency}</p>
      </div>
    </article>
  )
}
