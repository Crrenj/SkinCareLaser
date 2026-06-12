import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { SiWhatsapp } from 'react-icons/si'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ContactForm from '@/components/ContactForm'
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
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />

      <main id="main-content" className="flex-grow">
        {/* Hero */}
        <section className="px-6 lg:px-14 py-12 lg:py-20 bg-sand-200 border-b border-sand-300">
          <div className="max-w-5xl mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-clay-700 font-semibold mb-4">
              {t('eyebrow')}
            </div>
            <h1
              className="font-serif text-[40px] lg:text-[60px] text-ink-900 leading-[1.05] -tracking-[0.02em] mb-5 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-700"
              dangerouslySetInnerHTML={{ __html: t.raw('titleHtml') as string }}
            />
            <p className="font-serif italic text-[18px] lg:text-[20px] text-ink-700 leading-[1.5] max-w-2xl">
              {t('headerSubtitle')}
            </p>
          </div>
        </section>

        {/* Formulaire + coordonnées */}
        <section className="px-6 lg:px-14 py-12 lg:py-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-start">
            <ContactForm />

            <aside className="flex flex-col gap-5">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-clay-700 font-semibold pb-3 border-b border-sand-300">
                {t('contactInfoHeading')}
              </div>

              <div className="rounded-lg border border-sand-300 bg-sand-50 p-6 flex flex-col gap-5">
                <InfoBlock label={t('addressHeading')} first>
                  <p className="font-serif text-[18px] leading-[1.45] text-ink-900">
                    {t('addressLine1')}
                    <small className="block font-sans text-[13px] text-ink-500 mt-1">
                      {t('addressLine2')}
                    </small>
                  </p>
                </InfoBlock>

                {phoneHref && settings.contact_phone && (
                  <InfoBlock label={t('phoneHeading')}>
                    <a
                      href={phoneHref}
                      className="font-mono text-[14px] text-ink-800 hover:text-clay-700 transition-colors"
                    >
                      {settings.contact_phone}
                    </a>
                  </InfoBlock>
                )}

                {emailHref && settings.contact_email && (
                  <InfoBlock label={t('emailHeading')}>
                    <a
                      href={emailHref}
                      className="font-mono text-[14px] text-ink-800 break-all hover:text-clay-700 transition-colors"
                    >
                      {settings.contact_email}
                    </a>
                  </InfoBlock>
                )}

                <InfoBlock label={t('hoursHeading')}>
                  <ul className="text-[14px] text-ink-800 leading-[1.7]">
                    <li>{t('hoursWeekday')}</li>
                    <li>{t('hoursSaturday')}</li>
                    <li className="text-brick-600">{t('hoursSunday')}</li>
                  </ul>
                </InfoBlock>
              </div>

              {waHref && (
                <div className="rounded-lg border border-sand-300 bg-sand-50 p-6">
                  <h2 className="font-serif text-[20px] text-ink-900 leading-tight mb-1.5">
                    {t('whatsappHeading')}
                  </h2>
                  <p className="text-[13.5px] text-ink-700 leading-[1.55] mb-4">
                    {t('whatsappDescription')}
                  </p>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-5 py-3 rounded-[4px] bg-[#25D366] text-white font-medium text-[14px] hover:bg-[#1ebd5a] transition-colors"
                  >
                    <SiWhatsapp size={16} />
                    {t('whatsappButton')}
                  </a>
                </div>
              )}
            </aside>
          </div>
        </section>

        {/* Localisation */}
        <section className="px-6 lg:px-14 pb-16 lg:pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-clay-700 font-semibold mb-6 pb-3 border-b border-sand-300">
              {t('mapHeading')}
            </div>
            <div className="h-[380px] lg:h-[440px] rounded-lg border border-sand-300 overflow-hidden">
              <iframe
                src="https://maps.google.com/maps?q=Calle%20Jesus%20de%20Galindez%20Esq%20Calle%203%20Cerros%20de%20Gurabo%20Santiago%20República%20Dominicana&output=embed"
                className="w-full h-full"
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

function InfoBlock({
  label,
  first = false,
  children,
}: {
  label: string
  first?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={first ? '' : 'border-t border-sand-300 pt-5'}>
      <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500 mb-2">
        {label}
      </div>
      {children}
    </div>
  )
}
