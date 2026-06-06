import type { Metadata } from 'next'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { SiWhatsapp } from 'react-icons/si'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { Link } from '@/i18n/navigation'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'
import {
  getShopSettings,
  telHref,
  whatsappHref,
  mailtoHref,
} from '@/lib/getShopSettings'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.pharmacie' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/pharmacie'),
      languages: buildLanguageAlternates('/pharmacie'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

export default async function PharmaciePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Pharmacie')
  const settings = await getShopSettings()
  const phoneHref = telHref(settings.contact_phone)
  const waHref = whatsappHref(settings.whatsapp_number)
  const emailHref = mailtoHref(settings.contact_email)

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />

      <main id="main-content" className="flex-grow">
        {/* Hero éditorial */}
        <section className="px-6 lg:px-14 py-12 lg:py-20 bg-sand-200">
          <div className="max-w-4xl mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-clay-700 font-semibold mb-4">
              {t('eyebrow')}
            </div>
            <h1
              className="font-serif text-[40px] lg:text-[60px] text-ink-900 leading-[1.05] -tracking-[0.02em] mb-5 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-700"
              dangerouslySetInnerHTML={{ __html: t.raw('title') as string }}
            />
            <p className="font-serif italic text-[18px] lg:text-[20px] text-ink-700 leading-[1.5] max-w-2xl">
              {t('subtitle')}
            </p>
          </div>
        </section>

        {/* Carte + Infos */}
        <section className="px-6 lg:px-14 py-12 lg:py-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-14">
            {/* Carte Google Maps */}
            <div className="h-[400px] lg:h-auto lg:min-h-[480px] rounded-md overflow-hidden border border-sand-300">
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

            {/* Infos contact */}
            <aside className="flex flex-col gap-5">
              <div className="bg-white border border-sand-300 rounded-md p-6">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-clay-700 font-semibold mb-3">
                  {t('locationLabel')}
                </div>
                <h2 className="font-serif text-[26px] leading-tight text-ink-900 mb-4 -tracking-[0.005em]">
                  {t('locationName')}
                </h2>

                <InfoLine icon={<MapPin size={16} strokeWidth={1.7} />}>
                  <p className="text-[14px] text-ink-800 leading-[1.55]">
                    {t('addressLine1')}<br />
                    {t('addressLine2')}
                  </p>
                </InfoLine>

                <InfoLine icon={<Clock size={16} strokeWidth={1.7} />}>
                  <p className="text-[14px] text-ink-800 leading-[1.55]">
                    {t('hoursWeekday')}<br />
                    {t('hoursSaturday')}<br />
                    <span className="text-ink-500">{t('hoursSunday')}</span>
                  </p>
                </InfoLine>

                {phoneHref && settings.contact_phone && (
                  <InfoLine icon={<Phone size={16} strokeWidth={1.7} />}>
                    <a
                      href={phoneHref}
                      className="text-[14px] text-clay-700 hover:text-clay-800 transition-colors"
                    >
                      {settings.contact_phone}
                    </a>
                  </InfoLine>
                )}

                {waHref && settings.whatsapp_number && (
                  <InfoLine icon={<SiWhatsapp size={16} />}>
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] text-clay-700 hover:text-clay-800 transition-colors"
                    >
                      {settings.whatsapp_number}
                    </a>
                  </InfoLine>
                )}

                {emailHref && settings.contact_email && (
                  <InfoLine icon={<Mail size={16} strokeWidth={1.7} />}>
                    <a
                      href={emailHref}
                      className="text-[14px] text-clay-700 hover:text-clay-800 break-all transition-colors"
                    >
                      {settings.contact_email}
                    </a>
                  </InfoLine>
                )}
              </div>

              <Link
                href="/catalogue"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-sm bg-clay-700 text-on-accent text-[12.5px] font-semibold uppercase tracking-wider hover:bg-clay-800 transition-colors"
              >
                {t('ctaCatalogue')}
              </Link>
            </aside>
          </div>
        </section>

        {/* Bloc "Comment venir" + "Pour qui" */}
        <section className="px-6 lg:px-14 py-14 lg:py-20 bg-sand-100">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
            <article className="bg-white border border-sand-300 rounded-md p-7">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-clay-700 font-semibold mb-3">
                {t('access.eyebrow')}
              </div>
              <h3 className="font-serif text-[24px] text-ink-900 mb-3 -tracking-[0.005em]">
                {t('access.title')}
              </h3>
              <p className="text-[14.5px] leading-[1.65] text-ink-700">
                {t('access.body')}
              </p>
            </article>

            <article className="bg-white border border-sand-300 rounded-md p-7">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-clay-700 font-semibold mb-3">
                {t('forWho.eyebrow')}
              </div>
              <h3 className="font-serif text-[24px] text-ink-900 mb-3 -tracking-[0.005em]">
                {t('forWho.title')}
              </h3>
              <p className="text-[14.5px] leading-[1.65] text-ink-700">
                {t('forWho.body')}
              </p>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function InfoLine({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-sand-200 last:border-b-0">
      <span className="shrink-0 mt-1 text-clay-700">{icon}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
