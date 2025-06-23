// src/app/page.tsx
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

type Product = {
  id: string
  name: string
  price_dop: number
  image_url: string | null
}

export default async function Home() {
  return (
    <>
      <NavBar />
      <main className="p-6" style={{ backgroundColor: '#EDEAE5' }}>
        {/* Contenu de bienvenue */}
        <h1 className="text-2xl font-bold">Bienvenue sur notre site</h1>
        <p className="mt-4 text-lg">Découvrez nos soins et services exclusifs.</p>

        {/* Section PRODUITS POPULAIRES */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Produits Populaires</h2>
          <p>// ...contenu des produits populaires...</p>
        </section>

        {/* Section AVIS SUR LA PHARMACIE */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Avis sur la Pharmacie</h2>
          <p>// ...contenu des avis des clients...</p>
        </section>

        {/* Section DIRECTION */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Direction</h2>
          <p>// ...informations pour nous trouver (adresse, carte, etc.)...</p>
        </section>

        {/* Section HORAIRES */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Horaires</h2>
          <p>// ...horaires d'ouverture...</p>
        </section>

        {/* Section QUI NOUS SOMMES */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Qui Nous Sommes</h2>
          <p>// ...explication de notre histoire et valeurs...</p>
        </section>
      </main>
      <Footer />
    </>
  )
}
