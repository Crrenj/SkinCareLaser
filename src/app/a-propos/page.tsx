import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import ReviewCard from '@/components/ReviewCard'
import BestProductsCard from '@/components/BestProductsCard'

export default async function AProposPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--background)]">
      <NavBar />

      <section className="relative w-full h-[60vh]">
        <Image
          src="/image/edificio.jpg"
          alt="Façade de la pharmacie"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-md">
            À propos de <span className="text-primary-200">FARMAU</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg sm:text-xl text-white drop-shadow-sm">
            Première pharmacie 100 % dermatologique de République Dominicaine,
            FARMAU met l&apos;expertise médicale au service de votre peau.
            Nos pharmaciens-dermatologues vous accompagnent avec des conseils
            personnalisés et une sélection rigoureuse de soins cliniquement prouvés.
          </p>
        </div>
      </section>

      <main className="flex-1 p-6">

        <section className="mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Produits Populaires</h2>
            <button className="text-primary font-semibold hover:underline focus:outline-none rounded">
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

        <section className="mt-12 flex flex-col items-center">
          <Image
            src="/image/equipe.png"
            alt="Équipe FARMAU"
            width={600}
            height={240}
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          <p className="mt-4 text-center text-lg max-w-2xl">
            Nos pharmaciens-dermatologues, formés en Europe et aux États-Unis,
            sont disponibles en continu pour analyser votre peau, décrypter les
            listes INCI et bâtir une routine sur-mesure.
          </p>
        </section>

        <section className="mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Avis sur la Pharmacie</h2>
            <button className="text-primary font-semibold hover:underline focus:outline-none rounded">
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

        <section className="mt-12 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <Image
              src="/image/femme_produit_bras.png"
              alt="Présentation produit"
              width={500}
              height={400}
              className="rounded-lg object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
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
              <a href="tel:+18097243940" className="text-blue-600 hover:text-blue-800 transition-colors">
                +1 809 724 3940
              </a>
            </p>
            <p>
              <strong>WhatsApp Commandes :</strong>{' '}
              <a href="https://wa.me/18094122468" className="text-blue-600 hover:text-blue-800 transition-colors" target="_blank" rel="noopener noreferrer">
                +1 809 412 2468
              </a>
            </p>
            <p>
              <strong>Email :</strong>{' '}
              <a href="mailto:skin@skinlacercenter.net" className="text-blue-600 hover:text-blue-800 transition-colors">
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
              title="Localisation FARMAU"
            />
          </div>
        </section>
        {/* ---------- /HORAIRES & CONTACT ---------- */}

        <section className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Nos Valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Qualité Certifiée</h3>
              <p className="text-sm text-gray-600">
                Produits approuvés FDA/EMA, testés cliniquement pour votre sécurité.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Expertise Médicale</h3>
              <p className="text-sm text-gray-600">
                Pharmaciens-dermatologues formés en Europe et États-Unis.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Accompagnement Personnalisé</h3>
              <p className="text-sm text-gray-600">
                Analyse de peau, routines sur-mesure et suivi continu pour des résultats optimaux.
              </p>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
} 