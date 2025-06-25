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
        <CatalogueClient
          initialProducts={products ?? []}
          itemsByType={itemsByType}
        />
      </main>
      <Footer />
    </div>
  )
}
