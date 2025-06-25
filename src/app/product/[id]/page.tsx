import Image from 'next/image'
import { PlusCircle } from 'lucide-react'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabaseClient'
import ProductDetailCard from '@/components/ProductDetailCard'
import ProductCard from '@/components/ProductCard'
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

export default async function ProductPage() {  
  const { params } = arguments[0]  
  const id = params.id

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

  // fetch similaires par même gamme (premier range)
  const rangeTag = tagsByType.range?.[0]
  let similarProducts: {
    id: string
    name: string
    price: number
    currency: string
    description?: string
    images?: { url: string; alt: string }[]
    brand?: string
    range?: string
  }[] = []
  if (rangeTag) {
    const { data: allProds, error: simError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        description,
        currency,
        product_images ( url, alt ),
        product_tags ( tag:tags(name,tag_type) )
      `)
    if (simError) console.error(simError)
    similarProducts = (allProds ?? [])
      .filter(p =>
        p.id !== id &&
        p.product_tags?.some(pt => {
          const tag = pt.tag as unknown as { name: string; tag_type: string };
          return tag.name === rangeTag;
        })
      )
      .slice(0, 5)
      .map(p => {
        const tags = p.product_tags?.map(pt => pt.tag).flat() ?? []
        const brand = tags.find(t => t.tag_type === 'brand')?.name
        const range = tags.find(t => t.tag_type === 'range')?.name
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          currency: p.currency,
          description: p.description,
          images: p.product_images,
          brand,
          range
        }
      })
  }

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

      {/* Mode d'emploi */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4">Mode d'emploi</h2>
        <p className="text-slate-700">
          {/* Remplacez ce texte par le contenu réel */}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
          Ut accumsan, justo at venenatis commodo, urna mi cursus urna, 
          et fringilla libero metus nec sapien.
        </p>
      </section>

      {/* Produits similaires */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4">Produits similaires</h2>
        {similarProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {similarProducts.map(p => (
              <Link key={p.id} href={`/product/${p.id}`} className="block h-full">
                <ProductCard product={p}/>
              </Link>
            ))}
          </div>
        ) : (
          <p>Aucun produit similaire trouvé.</p>
        )}
      </section>
      <Footer />
    </>
  )
}
