import type { Metadata } from 'next'
import { ArrowRight, ShoppingBag, MessageCircle, MapPin, Clock, CreditCard, AlertCircle } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { Link } from '@/i18n/navigation'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.delivery' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/livraison'),
      languages: buildLanguageAlternates('/livraison'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

export default async function LivraisonPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Delivery')

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

        {/* Workflow 3 étapes */}
        <section className="px-6 lg:px-14 py-14 lg:py-20">
          <div className="max-w-5xl mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500 font-semibold mb-3">
              {t('howItWorks.eyebrow')}
            </div>
            <h2 className="font-serif text-[28px] lg:text-[36px] text-ink-900 mb-10 -tracking-[0.01em]">
              {t('howItWorks.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <Step
                num="01."
                icon={<ShoppingBag size={20} strokeWidth={1.7} />}
                title={t('howItWorks.step1Title')}
                body={t('howItWorks.step1Body')}
              />
              <Step
                num="02."
                icon={<MessageCircle size={20} strokeWidth={1.7} />}
                title={t('howItWorks.step2Title')}
                body={t('howItWorks.step2Body')}
              />
              <Step
                num="03."
                icon={<MapPin size={20} strokeWidth={1.7} />}
                title={t('howItWorks.step3Title')}
                body={t('howItWorks.step3Body')}
              />
            </div>
          </div>
        </section>

        {/* Infos pratiques (3 cartes) */}
        <section className="px-6 lg:px-14 py-14 lg:py-20 bg-sand-100">
          <div className="max-w-5xl mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-clay-700 font-semibold mb-3">
              {t('practical.eyebrow')}
            </div>
            <h2 className="font-serif text-[28px] lg:text-[36px] text-ink-900 mb-10 -tracking-[0.01em]">
              {t('practical.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <InfoCard
                icon={<Clock size={18} strokeWidth={1.7} />}
                title={t('practical.hoursTitle')}
                lines={[
                  t('practical.hoursWeekday'),
                  t('practical.hoursSaturday'),
                  t('practical.hoursSunday'),
                ]}
              />
              <InfoCard
                icon={<MapPin size={18} strokeWidth={1.7} />}
                title={t('practical.addressTitle')}
                lines={[t('practical.addressLine1'), t('practical.addressLine2')]}
              />
              <InfoCard
                icon={<CreditCard size={18} strokeWidth={1.7} />}
                title={t('practical.paymentTitle')}
                lines={[t('practical.paymentMethods'), t('practical.paymentNote')]}
              />
            </div>
          </div>
        </section>

        {/* TTL + Annulation */}
        <section className="px-6 lg:px-14 py-14 lg:py-20">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 p-6 bg-clay-50 border-l-4 border-clay-700 rounded-md">
              <AlertCircle size={22} strokeWidth={1.7} className="text-clay-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif text-[22px] text-ink-900 mb-2 -tracking-[0.005em]">
                  {t('ttl.title')}
                </h3>
                <p className="text-[14.5px] text-ink-800 leading-[1.6] mb-3">
                  {t('ttl.body')}
                </p>
                <p className="text-[14.5px] text-ink-700 leading-[1.6]">
                  {t('ttl.cancel')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA bas de page */}
        <section className="px-6 lg:px-14 py-14 lg:py-20 bg-sand-200">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-[32px] lg:text-[40px] text-ink-900 mb-4 -tracking-[0.015em]">
              {t('cta.title')}
            </h2>
            <p className="text-[15.5px] text-ink-700 mb-8 leading-[1.6]">
              {t('cta.body')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/catalogue"
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-sm bg-clay-700 text-on-accent text-[12.5px] font-semibold uppercase tracking-wider hover:bg-accent-hover transition-colors"
              >
                {t('cta.primary')}
                <ArrowRight size={16} strokeWidth={1.8} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center px-6 py-3.5 rounded-sm bg-transparent border border-ink-900 text-ink-900 text-[12.5px] font-semibold uppercase tracking-wider hover:bg-ink-900 hover:text-sand-50 transition-colors"
              >
                {t('cta.secondary')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function Step({
  num,
  icon,
  title,
  body,
}: {
  num: string
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <article className="bg-white border border-sand-300 rounded-md p-7">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="font-serif italic text-[48px] leading-none text-clay-400 -tracking-[0.02em]">
          {num}
        </div>
        <div className="w-10 h-10 rounded-sm bg-sand-100 flex items-center justify-center text-clay-700 shrink-0">
          {icon}
        </div>
      </div>
      <h3 className="font-serif text-[22px] leading-tight text-ink-900 mb-2.5 -tracking-[0.005em]">
        {title}
      </h3>
      <p className="text-[14px] leading-[1.6] text-ink-700">{body}</p>
    </article>
  )
}

function InfoCard({
  icon,
  title,
  lines,
}: {
  icon: React.ReactNode
  title: string
  lines: string[]
}) {
  return (
    <article className="bg-white border border-sand-300 rounded-md p-6">
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-sand-200">
        <div className="w-9 h-9 rounded-sm bg-sand-100 flex items-center justify-center text-clay-700">
          {icon}
        </div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-500 font-semibold">
          {title}
        </div>
      </div>
      <div className="text-[14px] leading-[1.55] text-ink-800 space-y-1">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </article>
  )
}
