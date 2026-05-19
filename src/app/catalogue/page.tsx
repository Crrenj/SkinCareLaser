import { createSupabaseServerClient } from '@/lib/supabaseServer'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import CatalogueClient from '@/components/CatalogueClient'

export const revalidate = 60

type TagItem = { name: string; tag_type: string }
type RangeJoin = {
  range: { id: string; name: string; brand: { id: string; name: string } | null } | null
}
type RawProduct = {
  id: string
  name: string
  description: string | null
  price: string | number
  currency: string
  product_images: { url: string; alt: string | null }[] | null
  product_ranges: RangeJoin[] | null
  product_tags: { tag: TagItem | null }[] | null
}

export default async function Catalogue() {
  const supabase = await createSupabaseServerClient()

  // 1. Produits + marques/gammes + tags
  const { data: products, error: pErr } = await supabase
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
    .limit(500)
    .returns<RawProduct[]>()

  // 2. Tous les tags disponibles
  const { data: tags, error: tErr } = await supabase
    .from('tags_with_types')
    .select('name, tag_type')
    .returns<TagItem[]>()

  if (pErr || tErr) {
    console.error(pErr || tErr)
    return <p className="p-6">Erreur de chargement</p>
  }

  // 3. Regrouper les tags par type
  const itemsByType: Record<string, string[]> = {}
  tags?.forEach(t => {
    itemsByType[t.tag_type] ??= []
    itemsByType[t.tag_type].push(t.name)
  })
  Object.keys(itemsByType).forEach(tagType => {
    itemsByType[tagType].sort()
  })

  // 4. Mapper les produits pour le front
  const mappedProducts = (products ?? []).map(p => {
    const firstRange = p.product_ranges?.[0]?.range ?? null
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      price: Number(p.price),
      currency: p.currency,
      images: p.product_images ?? [],
      brand: firstRange?.brand?.name ?? '',
      range: firstRange?.name ?? '',
      tags: (p.product_tags ?? []).flatMap(pt =>
        pt.tag ? [{ label: pt.tag.name, category: pt.tag.tag_type }] : []
      ),
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--background)]">
      <NavBar />
      <main className="flex-grow p-6">
        <CatalogueClient
          products={mappedProducts}
          itemsByType={itemsByType}
        />
      </main>
      <Footer />
    </div>
  )
}
