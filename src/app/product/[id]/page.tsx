import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ProductClient from '@/components/ProductClient'
import { notFound } from 'next/navigation'
import { JSX } from 'react'

type TagItem = { label: string; category: string }
type RawProduct = {
  id: string
  name: string
  description: string
  price_cents: string | number
  currency_code: string
  product_images: { url: string; alt: string | null }[]
  ranges: { id: string; name: string; brand: { id: string; name: string } }[]
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
    acc[tag.category] ??= []
    acc[tag.category].push(tag.label)
    return acc
  }, {})
}

export default async function ProductPage({
  params,
}: {
  params: { id: string }
}): Promise<JSX.Element> {
  const { id } = params

  // 1. Fetch produit principal
  const { data: prodRaw, error: pErr } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price_cents,
      currency_code,
      product_images ( url, alt ),
      ranges ( id, name, brand:brands ( id, name ) ),
      product_tags ( tag:tags ( label, category ) )
    `)
    .eq('id', id)
    .single()

  if (pErr || !prodRaw) notFound()

  // 2. Mapping principal
  const tagsByCategory = buildTagMap((prodRaw as any).product_tags)
  const mainProduct: MappedProduct = {
    id: prodRaw.id,
    name: prodRaw.name,
    description: prodRaw.description,
    price: Number(prodRaw.price_cents) / 100,
    currency: prodRaw.currency_code,
    images: (prodRaw as any).product_images,
    brand: ((prodRaw as any).ranges?.[0]?.brand as any)?.name ?? '',
    range: (prodRaw as any).ranges?.[0]?.name ?? '',
    tagsByCategory,
  }

  // 3. Produits similaires - étape A (même gamme)
  const rangeId = (prodRaw as any).ranges?.[0]?.id
  const { data: sameRange } = rangeId
    ? await supabase
        .from('products')
        .select(`
          id,
          name,
          price_cents,
          currency_code,
          product_images ( url, alt ),
          ranges ( id, name, brand:brands ( id, name ) ),
          product_tags ( tag:tags ( label, category ) )
        `)
        .eq('ranges.id', rangeId)
        .neq('id', id)
        .limit(3)
    : { data: null }

  // 4. Produits similaires - étape B (tags communs par catégorie)
  const { data: candidates } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price_cents,
      currency_code,
      product_images ( url, alt ),
      ranges ( id, name, brand:brands ( id, name ) ),
      product_tags ( tag:tags ( label, category ) )
    `)
    .neq('id', id)
    .limit(50)

  const wantCats = ['skin_type', 'category', 'need']
  const mainTags = tagsByCategory

  const stepB = (candidates || [])
    .map((p: any) => {
      const mapB = buildTagMap(p.product_tags)
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
    price: Number(p.price_cents) / 100,
    currency: p.currency_code,
    images: p.product_images,
    brand: (p.ranges?.[0]?.brand as any)?.name ?? '',
    range: p.ranges?.[0]?.name ?? '',
    tagsByCategory: buildTagMap(p.product_tags),
  }))

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
