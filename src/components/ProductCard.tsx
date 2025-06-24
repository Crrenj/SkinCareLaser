import Image from 'next/image'

type ProductImage = { url: string; alt: string }
type Product = {
  id: string
  name: string
  price: number
  currency: string
  images?: ProductImage[]
}

type Props = { product: Product }

export default function ProductCard({ product }: Props) {
  const price = product.price.toFixed(2)
  return (
    <article className="border rounded-lg p-3 bg-white">
      <Image
        src={product.images?.[0]?.url ?? '/placeholder.png'}
        alt={product.images?.[0]?.alt ?? product.name}
        width={300}
        height={300}
        className="w-full h-40 object-cover rounded"
      />
      <h2 className="mt-2 font-semibold">{product.name}</h2>
      <p className="text-lg">{price} {product.currency}</p>
    </article>
  )
}
