import type { Metadata } from 'next'
import { ArrowRight, Pill, Microscope, Users, Heart } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { Link } from '@/i18n/navigation'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

export const revalidate = 86400

const PILLARS = [
  { key: 'pharmacist', icon: Pill },
  { key: 'curation', icon: Microscope },
  { key: 'human', icon: Users },
  { key: 'care', icon: Heart },
] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.manifesto' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/manifeste'),
      languages: buildLanguageAlternates('/manifeste'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

export default async function ManifestePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Manifesto')

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />

      <main id="main-content" className="flex-grow">
        {/* Hero éditorial — sand → clay gradient */}
        <section className="relative px-6 lg:px-14 py-16 lg:py-28 bg-gradient-to-br from-sand-100 via-sand-300 to-clay-200 overflow-hidden">
          <div className="relative max-w-4xl mx-auto z-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-clay-700 font-semibold mb-5 px-3 py-1 border border-clay-700/40 rounded-sm inline-block">
              {t('eyebrow')}
            </div>
            <h1
              className="font-serif text-[44px] lg:text-[72px] text-ink-900 leading-[0.98] -tracking-[0.025em] mb-6 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-700"
              dangerouslySetInnerHTML={{ __html: t.raw('title') as string }}
            />
            <p className="font-serif italic text-[20px] lg:text-[24px] text-ink-700 leading-[1.4] max-w-2xl">
              {t('lede')}
            </p>
          </div>
        </section>

        {/* Préambule éditorial */}
        <section className="px-6 lg:px-14 py-14 lg:py-20">
          <div className="max-w-3xl mx-auto">
            <p
              className="font-serif text-[22px] lg:text-[28px] text-ink-900 leading-[1.4] mb-6 -tracking-[0.005em] first-letter:font-serif first-letter:text-[64px] first-letter:leading-none first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-clay-700"
              dangerouslySetInnerHTML={{ __html: t.raw('intro1') as string }}
            />
            <p className="text-[16.5px] leading-[1.75] text-ink-800 mb-5">
              {t('intro2')}
            </p>
            <p className="text-[16.5px] leading-[1.75] text-ink-800">
              {t('intro3')}
            </p>
          </div>
        </section>

        {/* 4 piliers */}
        <section className="px-6 lg:px-14 py-14 lg:py-20 bg-sand-100">
          <div className="max-w-5xl mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-clay-700 font-semibold mb-3">
              {t('pillars.eyebrow')}
            </div>
            <h2 className="font-serif text-[32px] lg:text-[44px] text-ink-900 mb-10 -tracking-[0.015em]">
              {t('pillars.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              {PILLARS.map((pillar, i) => {
                const Icon = pillar.icon
                return (
                  <article
                    key={pillar.key}
                    className="bg-white border border-sand-300 rounded-md p-7 lg:p-8"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="font-serif italic text-[36px] leading-none text-clay-400 -tracking-[0.01em]">
                        0{i + 1}.
                      </div>
                      <div className="w-10 h-10 rounded-sm bg-sand-100 flex items-center justify-center text-clay-700 ml-auto shrink-0">
                        <Icon size={18} strokeWidth={1.7} />
                      </div>
                    </div>
                    <h3 className="font-serif text-[22px] lg:text-[24px] leading-tight text-ink-900 mb-3 -tracking-[0.005em]">
                      {t(`pillars.${pillar.key}.title`)}
                    </h3>
                    <p className="text-[14.5px] leading-[1.65] text-ink-700">
                      {t(`pillars.${pillar.key}.body`)}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Citation pharmacien */}
        <section className="px-6 lg:px-14 py-16 lg:py-24 bg-ink-900">
          <div className="max-w-3xl mx-auto text-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-clay-400 font-semibold mb-6">
              {t('quote.eyebrow')}
            </div>
            <blockquote className="font-serif italic text-[28px] lg:text-[40px] text-sand-50 leading-[1.25] -tracking-[0.015em] mb-7">
              «&nbsp;{t('quote.text')}&nbsp;»
            </blockquote>
            <cite className="not-italic text-[13px] uppercase tracking-[0.18em] font-mono text-clay-400 font-semibold">
              {t('quote.attribution')}
            </cite>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 lg:px-14 py-14 lg:py-20 bg-sand-200">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-[32px] lg:text-[40px] text-ink-900 mb-4 -tracking-[0.015em]">
              {t('cta.title')}
            </h2>
            <p className="text-[15.5px] text-ink-700 mb-8 leading-[1.6] max-w-xl mx-auto">
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
                href="/a-propos"
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
