/* src/app/page.tsx */
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import ReviewCard from '@/components/ReviewCard'
import BestProductsCard from '@/components/BestProductsCard'

export default async function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--background)]">
      <NavBar />

      {/* ---------- HERO ---------- */}
      <section className="relative w-full h-[60vh]">
        <Image
          src="/image/edificio.jpg"
          alt="Façade de la pharmacie"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-md">
            Bienvenue à <span className="text-primary-200">FARMAU</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg sm:text-xl text-white drop-shadow-sm">
            Première pharmacie 100 % dermatologique de République Dominicaine,
            FARMAU met l’expertise médicale au service de votre peau.
            Nos pharmaciens-dermatologues vous accompagnent avec des conseils
            personnalisés et une sélection rigoureuse de soins cliniquement prouvés.
          </p>
        </div>
      </section>
      {/* ---------- /HERO ---------- */}

      <main className="flex-1 p-6">

        {/* ---------- PRODUITS POPULAIRES ---------- */}
        <section className="mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Produits Populaires</h2>
            <button className="text-primary font-semibold hover:underline">
              Voir la tendance
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BestProductsCard
              name="Cica-Crème Réparatrice"
              price="1 150 DOP"
              desc="79 % de réparation cutanée en 48 h*"
              imageSrc="/image/produit_test.png"
            />
            <BestProductsCard
              name="Sérum Vitamine C 15 %"
              price="1 380 DOP"
              desc="Éclat immédiat, rides lissées en 4 sem."
              imageSrc="/image/produit_test.png"
            />
            <BestProductsCard
              name="Fluide Solaire SPF 50+"
              price="925 DOP"
              desc="Protection UVA/UVB, fini invisible"
              imageSrc="/image/produit_test.png"
            />
          </div>
        </section>
        {/* ---------- /PRODUITS POPULAIRES ---------- */}

        {/* ---------- ÉQUIPE ---------- */}
        <section className="mt-12 flex flex-col items-center">
          <Image
            src="/image/equipe.png"
            alt="Équipe FARMAU"
            width={600}
            height={240}
            className="object-cover rounded-lg"
          />
          <p className="mt-4 text-center text-lg max-w-2xl">
            Nos pharmaciens-dermatologues, formés en Europe et aux États-Unis,
            sont disponibles en continu pour analyser votre peau, décrypter les
            listes INCI et bâtir une routine sur-mesure.
          </p>
        </section>
        {/* ---------- /ÉQUIPE ---------- */}

        {/* ---------- AVIS ---------- */}
        <section className="mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Avis sur la Pharmacie</h2>
            <button className="text-primary font-semibold hover:underline">
              Voir plus
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReviewCard
              author="Valentina R."
              rating={5}
              content="Diagnostic de peau précis ! Une différence après deux semaines."
            />
            <ReviewCard
              author="Carlos M."
              rating={4}
              content="Grande variété de marques dermatologiques introuvables ailleurs."
            />
            <ReviewCard
              author="Ana-Luisa G."
              rating={5}
              content="Protocole post-acné efficace : taches atténuées de moitié !"
            />
            <ReviewCard
              author="Julia P."
              rating={4}
              content="Commande WhatsApp prête en 10 min, très pratique."
            />
          </div>
        </section>
        {/* ---------- /AVIS ---------- */}

        {/* ---------- BANNIÈRE PRODUIT IMPORT ---------- */}
        <section className="mt-12 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <Image
              src="/image/femme_produit_bras.png"
              alt="Présentation produit"
              width={500}
              height={400}
              className="rounded-lg object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold leading-relaxed">
              Parce que votre peau mérite le meilleur, nous importons uniquement
              des soins certifiés FDA / EMA, testés sous contrôle dermatologique
              et conformes aux normes européennes.
            </p>
          </div>
        </section>
        {/* ---------- /BANNIÈRE PRODUIT IMPORT ---------- */}

        {/* ---------- HORAIRES & CONTACT ---------- */}
        <section className="mt-12 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-semibold">Horaires & Contact</h2>
            <p><strong>Horaires :</strong> Lundi – Vendredi : 6 h 30 – 17 h 00</p>
            <p>
              <strong>Adresse :</strong>{' '}
              Calle Jesus de Galindez Esq. Calle 3, Cerros de Gurabo,
              Santiago, R.D.
            </p>
            <p>
              <strong>Téléphone :</strong>{' '}
              <a href="tel:+18097243940" className="text-blue-600">
                +1 809 724 3940
              </a>
            </p>
            <p>
              <strong>WhatsApp Commandes :</strong>{' '}
              <a href="https://wa.me/18094122468" className="text-blue-600">
                +1 809 412 2468
              </a>
            </p>
            <p>
              <strong>Email :</strong>{' '}
              <a href="mailto:skin@skinlacercenter.net" className="text-blue-600">
                skin@skinlacercenter.net
              </a>
            </p>
          </div>

          {/* Carte Google Maps */}
          <div className="flex-1 h-64">
            <iframe
              src="https://maps.google.com/maps?q=Calle%20Jesus%20de%20Galindez%20Esq%20Calle%203%20Cerros%20de%20Gurabo%20Santiago%20República%20Dominicana&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
        {/* ---------- /HORAIRES & CONTACT ---------- */}

      </main>

      <Footer />
    </div>
  )
}
