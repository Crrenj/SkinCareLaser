import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

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
        <h1 className="text-2xl font-bold mb-4">Catalogue de produits</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products?.map((p) => (
            <article key={p.id} className="border rounded-lg p-3">
              <Image
                src={p.product_images?.[0]?.url ?? '/placeholder.png'}
                alt={p.product_images?.[0]?.alt ?? p.name}
                width={300}
                height={300}
                className="w-full h-40 object-cover rounded"
              />
              <h2 className="mt-2 font-semibold">{p.name}</h2>
              <p className="text-lg">{p.price} {p.currency}</p>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
