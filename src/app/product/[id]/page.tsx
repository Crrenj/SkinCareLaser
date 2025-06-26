import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ProductDetailCard from '@/components/ProductDetailCard'
import ProductCard from '@/components/ProductCard'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import { PlusCircle } from 'lucide-react'

type Tag = { name: string; tag_type: string }
type Product = {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  product_images?: { url: string; alt: string }[]
  product_tags?: { tag: Tag }[]
}

// 1) utilitaire pour construire Map<tag_type, Set<name>>
function buildTagMap(tags: Tag[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  tags.forEach(t => {
    const type = t.tag_type
    const name = t.name.toLowerCase()
    if (!map.has(type)) map.set(type, new Set())
    map.get(type)!.add(name)
  })
  return map
}

type PageProps = { params: Promise<{ id: string }> }
export default async function ProductPage({ params }: PageProps) {
  // 1️⃣ récupérer l’ID dynamique
  const { id } = await params

  // fetch du produit principal
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,name,description,price,currency,
      product_images(url,alt),
      product_tags(tag:tags(name,tag_type))
    `)
    .eq('id', id)
    .single()
  if (error || !product) return <p className="p-6">Produit non trouvé</p>

  // construire tagsByType pour le principal
  const mainTags = product.product_tags?.map(pt => pt.tag).flat() ?? []
  const tagsByType = buildTagMap(mainTags)
  const rangeTags = tagsByType.get('range') ?? new Set()

  // fetch de tous les autres produits
  const { data: allProds, error: simError } = await supabase
    .from('products')
    .select(`
      id,name,description,price,currency,
      product_images(url,alt),
      product_tags(tag:tags(name,tag_type))
    `)
  if (simError) console.error(simError)

  const others = (allProds ?? []).filter(p => p.id !== id)

  // A) produits même gamme (max 3)
  const sameRange = others
    .filter(p =>
      (p.product_tags ?? [])
        .map(pt => pt.tag)
        .flat()
        .some(tag =>
          tag.tag_type === 'range' &&
          rangeTags.has(tag.name.toLowerCase())
        )
    )
    .slice(0, 3)

  // B) produits partageant skin_type, category et need (max 2)
  const otherMatches = others
    .filter(p => !sameRange.includes(p))
    .filter(p => {
      const tags = p.product_tags?.map(pt => pt.tag).flat() ?? []
      const m = buildTagMap(tags)
      return ['skin_type','category','need'].every(cat => {
        const source = tagsByType.get(cat) ?? new Set()
        const target = m.get(cat) ?? new Set()
        return [...source].some(v => target.has(v))
      })
    })
    .slice(0, 2)

  // C) combiner et formater pour ProductCard
  const similarProducts = [...sameRange, ...otherMatches]
    .map(p => {
      const tags = p.product_tags?.map(pt => pt.tag).flat() ?? []
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: p.currency,
        images: p.product_images,
        brand: tags.find(t => t.tag_type === 'brand')?.name,
        range: tags.find(t => t.tag_type === 'range')?.name
      }
    })

  return (
    <>
      <NavBar />
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-4 text-sm text-gray-500 mt-8">
        <ol className="flex space-x-2">
          <li><Link href="/">Accueil</Link></li>
          <li>/</li>
          <li><Link href="/catalogue">Catalogue</Link></li>
          <li>/</li>
          <li aria-current="page" className="text-gray-700">{product.name}</li>
        </ol>
      </nav>

      {/* détail produit */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProductDetailCard
          product={product}
          images={product.product_images}
          tagsByType={Object.fromEntries(
            Array.from(tagsByType.entries()).map(([k,v])=>[k, Array.from(v)])
          )}
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
                <ProductCard product={p} />
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
