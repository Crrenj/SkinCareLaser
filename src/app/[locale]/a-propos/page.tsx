import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import ReviewCard from '@/components/ReviewCard'
import BestProductsCard from '@/components/BestProductsCard'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.about' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/a-propos'),
      languages: buildLanguageAlternates('/a-propos'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

export default async function AProposPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('About')

  return (
    <div className="flex flex-col min-h-screen bg-sand-200">
      <NavBar />

      <section className="relative w-full h-[60vh]">
        <Image
          src="/image/edificio.jpg"
          alt={t('buildingAlt')}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-md">
            {t('heroTitlePrefix')}<span className="text-sand-200">{t('heroBrand')}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg sm:text-xl text-white drop-shadow-sm">
            {t('heroDescription')}
          </p>
        </div>
      </section>

      <main id="main-content" className="flex-1 p-6">

        <section className="mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('popularProductsHeading')}</h2>
            <button className="text-clay-700 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700 rounded">
              {t('seeTrend')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BestProductsCard
              name={t('products.cicaName')}
              price="1 150 DOP"
              desc={t('products.cicaDesc')}
              imageSrc="/image/produit_test.png"
            />
            <BestProductsCard
              name={t('products.vitCName')}
              price="1 380 DOP"
              desc={t('products.vitCDesc')}
              imageSrc="/image/produit_test.png"
            />
            <BestProductsCard
              name={t('products.spfName')}
              price="925 DOP"
              desc={t('products.spfDesc')}
              imageSrc="/image/produit_test.png"
            />
          </div>
        </section>

        <section className="mt-12 flex flex-col items-center">
          <Image
            src="/image/equipe.png"
            alt={t('teamImageAlt')}
            width={600}
            height={240}
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          <p className="mt-4 text-center text-lg max-w-2xl">
            {t('teamDescription')}
          </p>
        </section>

        <section className="mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('reviewsHeading')}</h2>
            <button className="text-clay-700 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700 rounded">
              {t('seeMore')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReviewCard
              author="Valentina R."
              rating={5}
              content={t('reviews.r1Content')}
            />
            <ReviewCard
              author="Carlos M."
              rating={4}
              content={t('reviews.r2Content')}
            />
            <ReviewCard
              author="Ana-Luisa G."
              rating={5}
              content={t('reviews.r3Content')}
            />
            <ReviewCard
              author="Julia P."
              rating={4}
              content={t('reviews.r4Content')}
            />
          </div>
        </section>

        <section className="mt-12 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <Image
              src="/image/femme_produit_bras.png"
              alt={t('productImageAlt')}
              width={500}
              height={400}
              className="rounded-lg object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold leading-relaxed">
              {t('qualityDescription')}
            </p>
          </div>
        </section>

        <section className="mt-12 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-semibold">{t('hoursContactHeading')}</h2>
            <p><strong>{t('hoursLabel')}</strong> {t('hoursValue')}</p>
            <p>
              <strong>{t('addressLabel')}</strong>{' '}
              {t('addressValue')}
            </p>
            <p>
              <strong>{t('phoneLabel')}</strong>{' '}
              <a href="tel:+18097243940" className="text-clay-700 hover:text-clay-800 transition-colors">
                +1 809 724 3940
              </a>
            </p>
            <p>
              <strong>{t('whatsappLabel')}</strong>{' '}
              <a href="https://wa.me/18094122468" className="text-clay-700 hover:text-clay-800 transition-colors" target="_blank" rel="noopener noreferrer">
                +1 809 412 2468
              </a>
            </p>
            <p>
              <strong>{t('emailLabel')}</strong>{' '}
              <a href="mailto:skin@skinlacercenter.net" className="text-clay-700 hover:text-clay-800 transition-colors">
                skin@skinlacercenter.net
              </a>
            </p>
          </div>

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

        <section className="mt-12 bg-sand-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-ink-800">{t('valuesHeading')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-clay-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">{t('value1Title')}</h3>
              <p className="text-sm text-ink-700">
                {t('value1Description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-clay-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">{t('value2Title')}</h3>
              <p className="text-sm text-ink-700">
                {t('value2Description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-clay-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">{t('value3Title')}</h3>
              <p className="text-sm text-ink-700">
                {t('value3Description')}
              </p>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
