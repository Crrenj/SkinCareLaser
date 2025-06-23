/* src/app/page.tsx */
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--background)]">
      <NavBar />

      {/* ---------- HERO ---------- */}
      <section className="relative w-full h-[60vh]">
        {/* image plein-écran */}
        <Image
          src="/image/edificio.jpg"
          alt="Façade de la pharmacie"
          fill
          priority
          className="object-cover"
        />
        {/* voile léger pour lisibilité */}
        <div className="absolute inset-0 bg-black/30" />

        {/* texte centré */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-md">
            Bienvenue à <span className="text-primary-200">FARMAU</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg sm:text-xl text-white drop-shadow-sm">
            Notre pharmacie vous accueille dans un cadre moderne et chaleureux,
            alliant expertise et convivialité pour prendre soin de votre santé.
          </p>
        </div>
      </section>
      {/* ---------- /HERO ---------- */}

      <main className="flex-1 p-6">
        {/* exemple d’autres sections – à remplir plus tard ---------------- */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-2">Produits Populaires</h2>
          <p className="text-gray-700">// …contenu des produits populaires…</p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-2">Avis sur la Pharmacie</h2>
          <p className="text-gray-700">// …contenu des avis des clients…</p>
        </section>
        {/* --------------------------------------------------------------- */}

        {/* Section Horaires & Contact */}
        <section className="mt-12 flex flex-col lg:flex-row gap-6">
          {/* Infos à gauche */}
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-semibold">Horaires & Contact</h2>
            <p><strong>Horaires:</strong> Lundi - Vendredi : 6h30 - 17h00</p>
            <p><strong>Adresse:</strong> Calle Jesus de Galindez Esq. Calle 3, Cerros de Gurabo, Santiago, République Dominicaine</p>
            <p>
              <strong>Téléphone:</strong>{' '}
              <a href="tel:+18097243940" className="text-blue-500">+1 809 724 3940</a>
            </p>
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:skin@skinlacercenter.net" className="text-blue-500">
                skin@skinlacercenter.net
              </a>
            </p>
          </div>
          {/* Plan Google Maps à droite */}
          <div className="flex-1 h-64">
            <iframe
              src="https://maps.google.com/maps?q=Calle%20Jesus%20de%20Galindez%20Esq%20Calle%203%20Cerros%20de%20Gurabo%20Santiago%20República%20Dominicana&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
