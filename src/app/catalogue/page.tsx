import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { Search } from 'lucide-react' // ajout icône loupe

export default async function Catalogue() {
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      currency,
      product_images ( url, alt )
    `)
    .limit(12)

  if (error) {
    console.error(error)
    return <p className="p-6">Erreur de chargement</p>
  }

  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--background)]">
      <NavBar />
      <main className="flex-grow p-6">
        {/* Ligne 1 : barre de recherche */}
        <div className="flex justify-center mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
            <input
              type="text"
              placeholder="Rechercher un produit…"
              className="pl-10 pr-3 py-2 w-full border rounded-lg focus:outline-none"
            />
          </div>
        </div>
        {/* Ligne 2 : filtre + produits */}
        <div className="flex gap-6">
          <aside className="w-1/5">
            {/* ...filtres (checkboxes, select, etc.)... */}
          </aside>
          <section className="w-4/5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products?.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
