import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import CatalogueClient from '@/components/CatalogueClient'

export default async function Catalogue() {
  /* 1. Produits + marques/gammes + tags ---------------------------------- */
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
        tag:tags ( name, tag_type )
      )
    `)
    .limit(100)

  /* 2. Liste complète des tags (hors brand/range) ------------------------ */
  const { data: tags, error: tErr } = await supabase
    .from('tags')
    .select('name, tag_type')

  if (pErr || tErr) {
    console.error(pErr || tErr)
    return <p className="p-6">Erreur de chargement</p>
  }

  /* 3. Regrouper les tags par catégorie ---------------------------------- */
  const itemsByType: Record<string, string[]> = {}
  tags?.forEach(t => {
    itemsByType[t.tag_type] ||= []
    itemsByType[t.tag_type].push(t.name)
  })

  /* 4. Mapper les produits pour le front --------------------------------- */
  const mappedProducts =
  products?.map((p: any) => ({
    id         : p.id,
    name       : p.name,
    description: p.description,
    price      : Number(p.price),
    currency   : p.currency,
    images     : p.product_images,

    /* Gamme & marque : tableau d'un seul élément -> .[0] */
    brand      : p.product_ranges?.[0]?.range?.brand?.name ?? '',
    range      : p.product_ranges?.[0]?.range?.name ?? '',

    /* 🔧 FLATMAP pour aplatir */
    tags       : p.product_tags.flatMap((pt: any) => ({ label: pt.tag.name, category: pt.tag.tag_type }))
  })) ?? []


  /* 5. Rendu -------------------------------------------------------------- */
  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--background)]">
      <NavBar />
      <main className="flex-grow p-6">
        <CatalogueClient
          /** <-- adapte ici le nom des props attendues par CatalogueClient */
          products={mappedProducts}
          itemsByType={itemsByType}
        />
      </main>
      <Footer />
    </div>
  )
}
