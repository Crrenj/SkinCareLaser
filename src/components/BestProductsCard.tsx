import Image from 'next/image'
import { PlusCircle } from 'lucide-react'

type Props = {
  name: string
  price: string
  desc?: string
  imageSrc: string
}

export default function BestProductsCard({ name, price, desc, imageSrc }: Props) {
  return (
    <article className="relative border rounded-lg p-4 flex flex-col items-center bg-white">
      {/* icône ajouter au panier */}
      <PlusCircle
        className="absolute top-2 right-2 w-10 h-10 p-1 text-gray-800 bg-white rounded-full cursor-pointer"
      />
      <Image
        src={imageSrc}
        alt={name}
        width={200}
        height={200}
        className="object-cover rounded"
      />
      <h3 className="mt-4 font-semibold">{name}</h3>
      {desc && <p className="mt-1 text-sm text-gray-600">{desc}</p>}
      <p className="mt-2 text-primary font-bold">{price}</p>
    </article>
  )
}
