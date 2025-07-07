import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ProductClient from '@/components/ProductClient'
import { notFound } from 'next/navigation'
import { JSX } from 'react'

type TagItem = { name: string; tag_type: string }
type RawProduct = {
  id: string
  name: string
  description: string
  price: string | number
  currency: string
  product_images: { url: string; alt: string | null }[]
  product_ranges: { range: { id: string; name: string; brand: { id: string; name: string } } }[]
  product_tags: { tag: TagItem }[]
}

type MappedProduct = {
  id: string
  name: string
  description: string
  price: number
  currency: string
  images: { url: string; alt: string | null }[]
  brand: string
  range: string
  tagsByCategory: Record<string, string[]>
}

function buildTagMap(rawTags: any[]): Record<string, string[]> {
  return rawTags.reduce<Record<string, string[]>>((acc, { tag }) => {
    acc[tag.tag_type] ??= []
    acc[tag.tag_type].push(tag.name)
    return acc
  }, {})
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<JSX.Element> {
  const { id } = await params

  console.log('Fetching product with ID:', id)

  // 1. Fetch produit principal
  const { data: prodRaw, error: pErr } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
      currency,
      product_images ( url, alt ),
      product_ranges (
        range:ranges (
          id,
          name,
          brand:brands ( id, name )
        )
      ),
      product_tags (
        tag:tags_with_types ( name, tag_type )
      )
    `)
    .eq('id', id)
    .single()

  console.log('Product fetch result:', { prodRaw, error: pErr })

  if (pErr) {
    console.error('Product fetch error:', pErr)
    notFound()
  }

  if (!prodRaw) {
    console.log('Product not found')
    notFound()
  }

  // 2. Mapping principal
  const tagsByCategory = buildTagMap((prodRaw as any).product_tags || [])
  const mainProduct: MappedProduct = {
    id: prodRaw.id,
    name: prodRaw.name,
    description: prodRaw.description || '',
    price: Number(prodRaw.price),
    currency: prodRaw.currency,
    images: (prodRaw as any).product_images || [],
    brand: ((prodRaw as any).product_ranges?.[0]?.range?.brand as any)?.name ?? '',
    range: (prodRaw as any).product_ranges?.[0]?.range?.name ?? '',
    tagsByCategory,
  }

  console.log('Mapped product:', mainProduct)

  // 3. Produits similaires - étape A (même gamme)
  const rangeId = (prodRaw as any).product_ranges?.[0]?.range?.id
  const { data: sameRange } = rangeId
    ? await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          currency,
          product_images ( url, alt ),
          product_ranges (
            range:ranges (
              id,
              name,
              brand:brands ( id, name )
            )
          ),
          product_tags (
            tag:tags_with_types ( name, tag_type )
          )
        `)
        .eq('product_ranges.range_id', rangeId)
        .neq('id', id)
        .limit(3)
    : { data: null }

  // 4. Produits similaires - étape B (tags communs par catégorie)
  const { data: candidates } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      currency,
      product_images ( url, alt ),
      product_ranges (
        range:ranges (
          id,
          name,
          brand:brands ( id, name )
        )
      ),
      product_tags (
        tag:tags_with_types ( name, tag_type )
      )
    `)
    .neq('id', id)
    .limit(50)

  const wantCats = ['skin_type', 'category', 'need']
  const mainTags = tagsByCategory

  const stepB = (candidates || [])
    .map((p: any) => {
      const mapB = buildTagMap(p.product_tags || [])
      const ok = wantCats.every(
        cat =>
          Array.isArray(mainTags[cat]) &&
          Array.isArray(mapB[cat]) &&
          mainTags[cat].some(v => mapB[cat].includes(v))
      )
      return ok ? p : null
    })
    .filter((p): p is any => p !== null)
    .slice(0, 2)

  const similarRaw = [...(sameRange || []), ...stepB]

  // 5. Mapping similar
  const similarProducts: MappedProduct[] = similarRaw.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: Number(p.price),
    currency: p.currency,
    images: p.product_images || [],
    brand: (p.product_ranges?.[0]?.range?.brand as any)?.name ?? '',
    range: p.product_ranges?.[0]?.range?.name ?? '',
    tagsByCategory: buildTagMap(p.product_tags || []),
  }))

  console.log('Similar products count:', similarProducts.length)

  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--background)]">
      <NavBar />
      <main className="flex-grow p-6">
        <ProductClient
          product={mainProduct}
          similarProducts={similarProducts}
        />
      </main>
      <Footer />
    </div>
  )
}
