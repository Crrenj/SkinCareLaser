import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ContactForm from '@/components/ContactForm'
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'
import {
  getShopSettings,
  telHref,
  whatsappHref,
  mailtoHref,
} from '@/lib/getShopSettings'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.contact' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/contact'),
      languages: buildLanguageAlternates('/contact'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Contact')
  const settings = await getShopSettings()
  const phoneHref = telHref(settings.contact_phone)
  const waHref = whatsappHref(settings.whatsapp_number)
  const emailHref = mailtoHref(settings.contact_email)

  return (
    <div className="flex flex-col min-h-screen bg-sand-200">
      <NavBar />

      <main id="main-content" className="flex-1 p-6">
        <section className="text-center py-12">
          <h1 className="text-4xl font-bold text-ink-900 mb-4">{t('headerTitle')}</h1>
          <p className="text-xl text-ink-700 max-w-2xl mx-auto">
            {t('headerSubtitle')}
          </p>
        </section>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ContactForm />

          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-ink-900 mb-6">{t('contactInfoHeading')}</h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPinIcon className="h-6 w-6 text-clay-700 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ink-900">{t('addressHeading')}</h3>
                    <p className="text-ink-700">
                      {t('addressLine1')}<br />
                      {t('addressLine2')}
                    </p>
                  </div>
                </div>

                {phoneHref && settings.contact_phone && (
                  <div className="flex items-start space-x-4">
                    <PhoneIcon className="h-6 w-6 text-clay-700 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-ink-900">{t('phoneHeading')}</h3>
                      <p className="text-ink-700">
                        <a href={phoneHref} className="hover:text-clay-700 transition-colors">
                          {settings.contact_phone}
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {emailHref && settings.contact_email && (
                  <div className="flex items-start space-x-4">
                    <EnvelopeIcon className="h-6 w-6 text-clay-700 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-ink-900">{t('emailHeading')}</h3>
                      <p className="text-ink-700">
                        <a href={emailHref} className="hover:text-clay-700 transition-colors">
                          {settings.contact_email}
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  <ClockIcon className="h-6 w-6 text-clay-700 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ink-900">{t('hoursHeading')}</h3>
                    <div className="text-ink-700 space-y-1">
                      <p>{t('hoursWeekday')}</p>
                      <p>{t('hoursSaturday')}</p>
                      <p>{t('hoursSunday')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {waHref && (
            <div className="bg-sand-50 rounded-lg p-6 border-l-4 border-olive-600">
              <h3 className="text-lg font-semibold text-olive-600 mb-3">{t('whatsappHeading')}</h3>
              <p className="text-ink-800 mb-4">
                {t('whatsappDescription')}
              </p>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-olive-600 text-white rounded-md hover:bg-clay-700 transition-colors font-semibold"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                {t('whatsappButton')}
              </a>
            </div>
            )}
          </div>
        </div>

        <section className="mt-12 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-ink-900 mb-6 text-center">{t('mapHeading')}</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="h-96 rounded-lg overflow-hidden">
              <iframe
                src="https://maps.google.com/maps?q=Calle%20Jesus%20de%20Galindez%20Esq%20Calle%203%20Cerros%20de%20Gurabo%20Santiago%20República%20Dominicana&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title={t('mapIframeTitle')}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
