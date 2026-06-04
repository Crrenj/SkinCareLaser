import type { Metadata } from 'next'
import { HelpCircle, Truck, ClipboardList, Mail, MessageCircle, Phone } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import HelpForm from '@/components/HelpForm'
import { Link } from '@/i18n/navigation'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'
import { getShopSettings, telHref, whatsappHref, mailtoHref } from '@/lib/getShopSettings'

export const revalidate = 86400

const QUICK_ACCESS = [
  { key: 'faq', href: '/faq', Icon: HelpCircle },
  { key: 'delivery', href: '/livraison', Icon: Truck },
  { key: 'reservations', href: '/account/reservations', Icon: ClipboardList },
  { key: 'contact', href: '/contact', Icon: Mail },
] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.help' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/aide'),
      languages: buildLanguageAlternates('/aide'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Help')
  const settings = await getShopSettings()
  const waHref = whatsappHref(settings.whatsapp_number)
  const phoneHref = telHref(settings.contact_phone)
  const emailHref = mailtoHref(settings.contact_email)

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />

      <main id="main-content" className="flex-grow">
        {/* Hero */}
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

        {/* Accès rapides */}
        <section className="px-6 lg:px-14 py-12 lg:py-16">
          <div className="max-w-5xl mx-auto">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-clay-700 font-semibold mb-6 pb-3 border-b border-sand-300">
              {t('quickAccessHeading')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUICK_ACCESS.map(({ key, href, Icon }) => (
                <Link
                  key={key}
                  href={href}
                  className="group flex flex-col gap-3 p-5 rounded-lg border border-sand-300 bg-sand-50 hover:border-ink-900 hover:bg-sand-100 transition-colors"
                >
                  <Icon className="w-6 h-6 text-clay-700" strokeWidth={1.6} />
                  <span className="font-serif text-[19px] text-ink-900 leading-tight">
                    {t(`quickAccess.${key}.title`)}
                  </span>
                  <span className="text-[13.5px] text-ink-700 leading-[1.55]">
                    {t(`quickAccess.${key}.desc`)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Signaler un problème + canaux */}
        <section className="px-6 lg:px-14 pb-16 lg:pb-24">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12">
            <HelpForm />

            <aside className="flex flex-col gap-5">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-clay-700 font-semibold pb-3 border-b border-sand-300">
                {t('channels.heading')}
              </div>

              {waHref && (
                <ChannelCard
                  icon={<MessageCircle className="w-5 h-5 text-olive-600" strokeWidth={1.7} />}
                  heading={t('channels.whatsapp.heading')}
                  desc={t('channels.whatsapp.desc')}
                >
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-1 text-[13px] font-semibold text-olive-600 hover:text-clay-700 transition-colors"
                  >
                    {t('channels.whatsapp.cta')} →
                  </a>
                </ChannelCard>
              )}

              {emailHref && settings.contact_email && (
                <ChannelCard
                  icon={<Mail className="w-5 h-5 text-clay-700" strokeWidth={1.7} />}
                  heading={t('channels.email.heading')}
                  desc={t('channels.email.desc')}
                >
                  <a href={emailHref} className="inline-flex mt-1 text-[13px] font-mono text-ink-800 hover:text-clay-700 transition-colors">
                    {settings.contact_email}
                  </a>
                </ChannelCard>
              )}

              {phoneHref && settings.contact_phone && (
                <ChannelCard
                  icon={<Phone className="w-5 h-5 text-clay-700" strokeWidth={1.7} />}
                  heading={t('channels.phone.heading')}
                  desc={t('channels.phone.desc')}
                >
                  <a href={phoneHref} className="inline-flex mt-1 text-[13px] font-mono text-ink-800 hover:text-clay-700 transition-colors">
                    {settings.contact_phone}
                  </a>
                </ChannelCard>
              )}
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function ChannelCard({
  icon, heading, desc, children,
}: {
  icon: React.ReactNode; heading: string; desc: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 p-5 rounded-lg border border-sand-300 bg-sand-50">
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="font-serif text-[18px] text-ink-900">{heading}</span>
      </div>
      <p className="text-[13.5px] text-ink-700 leading-[1.55]">{desc}</p>
      {children}
    </div>
  )
}
