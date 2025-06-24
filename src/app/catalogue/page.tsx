import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import CatalogueClient from '@/components/CatalogueClient'
import { Search } from 'lucide-react'

export default async function Catalogue() {
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select(`
      id, name, price, currency,
      product_images ( url, alt ),
      product_tags ( tag:tags(name,tag_type) )
    `)
    .limit(100)

  const { data: tags, error: tErr } = await supabase
    .from('tags')
    .select('name,tag_type')

  if (pErr || tErr) {
    console.error(pErr || tErr)
    return <p className="p-6">Erreur de chargement</p>
  }

  // Group tags by type
  const itemsByType: Record<string, string[]> = {}
  tags?.forEach(tag => {
    itemsByType[tag.tag_type] ||= []
    itemsByType[tag.tag_type].push(tag.name)
  })

  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--background)]">
      <NavBar />
      <main className="flex-grow p-6">
        {/* Recherche */}
        <div className="flex justify-center mb-6">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Rechercher un produit…"
              className="pl-10 pr-3 py-2 w-full border rounded-lg focus:outline-none"
            />
          </div>
        </div>

        <CatalogueClient
          initialProducts={products ?? []}
          itemsByType={itemsByType}
        />
      </main>
      <Footer />
    </div>
  )
}
