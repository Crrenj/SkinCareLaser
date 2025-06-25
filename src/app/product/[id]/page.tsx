import Image from 'next/image'
import { PlusCircle } from 'lucide-react'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabaseClient'

type Product = {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  product_images?: { url: string; alt: string }[]
}

export default async function ProductPage(
  { params: { id } }: { params: { id: string } }
) {
  // fetch réel du produit
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
      currency,
      product_images ( url, alt )
    `)
    .eq('id', id)
    .single()
  if (error || !product) {
    console.error(error)
    return <p className="p-6">Produit non trouvé</p>
  }
  const images = product.product_images

  return (
    <>
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* colonne image */}
          <div className="flex justify-center">
            <Image
              src={images?.[0]?.url || '/placeholder.png'}
              alt={images?.[0]?.alt || product.name}
              width={500}
              height={500}
              className="object-contain"
            />
          </div>
          {/* colonne détails */}
          <div className="flex flex-col justify-center space-y-6">
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="text-gray-600">{product.description}</p>
            <p className="text-xl font-bold">
              {product.price.toFixed(2)} {product.currency}
            </p>
            <button className="flex items-center justify-center px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark">
              <PlusCircle className="mr-2" size={20} /> Add to cart
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
