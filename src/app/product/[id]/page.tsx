import Image from 'next/image'
import { PlusCircle } from 'lucide-react'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabaseClient'
import ProductDetailCard from '@/components/ProductDetailCard'
import Link from 'next/link'

type Product = {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  product_images?: { url: string; alt: string }[]
  product_tags?: { tag: { name: string; tag_type: string } }[]
}

export default async function ProductPage(
  { params: { id } }: { params: { id: string } }
) {
  // fetch réel du produit avec images + tags
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
      currency,
      product_images ( url, alt ),
      product_tags ( tag:tags(name,tag_type) )
    `)
    .eq('id', id)
    .single()
  if (error || !product) {
    console.error(error)
    return <p className="p-6">Produit non trouvé</p>
  }

  // extraire et grouper les tags
  const tags = product.product_tags?.map(pt => pt.tag).flat() ?? []
  const tagsByType: Record<string,string[]> = {}
  tags.forEach(t => {
    tagsByType[t.tag_type] ||= []
    tagsByType[t.tag_type].push(t.name)
  })

  const images = product.product_images

  return (
    <>
      <NavBar />
      {/* Breadcrumb avec marge accrue */}
      <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-4 text-sm text-gray-500 mt-8">
        <ol className="flex space-x-2">
          <li><Link href="/">Accueil</Link></li>
          <li>/</li>
          <li><Link href="/catalogue">Catalogue</Link></li>
          <li>/</li>
          <li aria-current="page" className="text-gray-700">{product.name}</li>
        </ol>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProductDetailCard
          product={product}
          images={images}
          tagsByType={tagsByType}
        />
      </div>
      <Footer />
    </>
  )
}
