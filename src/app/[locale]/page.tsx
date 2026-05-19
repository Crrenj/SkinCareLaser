import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import Banner from '@/components/Banner'
import { Link } from '@/i18n/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.home' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/'),
      languages: buildLanguageAlternates('/'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

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

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Home')

  const supabase = await createSupabaseServerClient()
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true })

  const activeBanners = banners || []

  return (
    <div className="flex flex-col min-h-screen bg-sand-200" lang={locale}>
      <NavBar />

      <main id="main-content" className="flex-1 p-6">
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

        <section className="mt-12 bg-white rounded-lg p-8 shadow-md">
          <h2 className="text-2xl font-bold text-center mb-8">
            {t('servicesTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/catalogue" className="group">
              <div className="text-center p-6 rounded-lg border border-sand-300 hover:border-clay-600 hover:shadow-lg transition-all duration-200">
                <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-sand-200">
                  <svg
                    className="w-8 h-8 text-clay-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">
                  {t('services.catalogueTitle')}
                </h3>
                <p className="text-sm text-ink-700">
                  {t('services.catalogueDescription')}
                </p>
              </div>
            </Link>

            <Link href="/a-propos" className="group">
              <div className="text-center p-6 rounded-lg border border-sand-300 hover:border-clay-600 hover:shadow-lg transition-all duration-200">
                <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-sand-200">
                  <svg
                    className="w-8 h-8 text-clay-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">{t('services.aboutTitle')}</h3>
                <p className="text-sm text-ink-700">
                  {t('services.aboutDescription')}
                </p>
              </div>
            </Link>

            <div className="text-center p-6 rounded-lg border border-sand-300 hover:border-clay-600 hover:shadow-lg transition-all duration-200 cursor-pointer">
              <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-clay-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">
                {t('services.consultationTitle')}
              </h3>
              <p className="text-sm text-ink-700">
                {t('services.consultationDescription')}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
