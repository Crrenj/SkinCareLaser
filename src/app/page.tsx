import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import Banner from '@/components/Banner'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

interface BannerData {
  id: string
  title: string
  description: string
  image_url: string
  link_url: string | null
  link_text: string | null
  banner_type: 'image_left' | 'image_right' | 'image_full'
  position: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  click_count: number
  view_count: number
}

export default async function Home() {
  // Récupérer les bannières actives
  const supabase = await createSupabaseServerClient()
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true })

  const activeBanners = banners || []

  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--background)]">
      <NavBar />

      <main className="flex-1 p-6">
        {/* ---------- BANNIÈRES DYNAMIQUES ---------- */}
        {activeBanners.length > 0 && (
          <section className="mt-8">
            <div className="space-y-8">
              {activeBanners.map((banner: BannerData) => (
                <Banner
                  key={banner.id}
                  id={banner.id}
                  title={banner.title}
                  description={banner.description}
                  imageUrl={banner.image_url}
                  linkUrl={banner.link_url || undefined}
                  linkText={banner.link_text || undefined}
                  bannerType={banner.banner_type}
                />
              ))}
            </div>
          </section>
        )}
        {/* ---------- /BANNIÈRES DYNAMIQUES ---------- */}

        {/* ---------- ACTIONS RAPIDES ---------- */}
        <section className="mt-12 bg-white rounded-lg p-8 shadow-md">
          <h2 className="text-2xl font-bold text-center mb-8">Nos Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/catalogue" className="group">
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Catalogue</h3>
                <p className="text-sm text-gray-600">
                  Découvrez notre sélection de produits dermatologiques certifiés
                </p>
              </div>
            </Link>
            
            <Link href="/a-propos" className="group">
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-200">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">À propos</h3>
                <p className="text-sm text-gray-600">
                  En savoir plus sur notre équipe et notre expertise
                </p>
              </div>
            </Link>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all duration-200 cursor-pointer">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Consultation</h3>
              <p className="text-sm text-gray-600">
                Consultez nos pharmaciens-dermatologues
              </p>
            </div>
          </div>
        </section>
        {/* ---------- /ACTIONS RAPIDES ---------- */}

        {/* ---------- INFORMATIONS PRATIQUES ---------- */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-blue-900">Horaires d'ouverture</h3>
            <div className="space-y-2 text-blue-800">
              <p><span className="font-medium">Lundi - Vendredi:</span> 8h00 - 20h00</p>
              <p><span className="font-medium">Samedi:</span> 8h00 - 18h00</p>
              <p><span className="font-medium">Dimanche:</span> 9h00 - 17h00</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-green-900">Contact rapide</h3>
            <div className="space-y-2 text-green-800">
              <p><span className="font-medium">WhatsApp:</span> +1 (809) 555-0124</p>
              <p><span className="font-medium">Téléphone:</span> +1 (809) 555-0123</p>
              <p><span className="font-medium">Email:</span> info@farmau.com</p>
            </div>
          </div>
        </section>
        {/* ---------- /INFORMATIONS PRATIQUES ---------- */}

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

      </main>

      <Footer />
    </div>
  )
}
