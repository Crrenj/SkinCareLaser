import type { Metadata } from 'next'
import { MessageCircle, Mail } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { Link } from '@/i18n/navigation'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

export const revalidate = 86400

const SECTIONS = [
  { key: 'reservation', items: ['q1', 'q2', 'q3', 'q4', 'q5'] },
  { key: 'products', items: ['q1', 'q2', 'q3', 'q4'] },
  { key: 'account', items: ['q1', 'q2', 'q3'] },
  { key: 'delivery', items: ['q1', 'q2', 'q3', 'q4'] },
  { key: 'privacy', items: ['q1', 'q2', 'q3'] },
] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.faq' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/faq'),
      languages: buildLanguageAlternates('/faq'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Faq')

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />

      <main id="main-content" className="flex-grow">
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

        <section className="px-6 lg:px-14 py-12 lg:py-16">
          <div className="max-w-3xl mx-auto flex flex-col gap-12">
            {SECTIONS.map((section) => (
              <div key={section.key}>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-clay-700 font-semibold mb-4 pb-3 border-b border-sand-300">
                  {t(`sections.${section.key}.heading`)}
                </div>
                <div className="flex flex-col">
                  {section.items.map((q) => (
                    <details
                      key={`${section.key}-${q}`}
                      className="group border-b border-sand-200 py-4"
                    >
                      <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                        <span className="font-serif text-[18px] lg:text-[20px] leading-[1.35] text-ink-900 -tracking-[0.005em]">
                          {t(`sections.${section.key}.${q}.q`)}
                        </span>
                        <span
                          aria-hidden
                          className="shrink-0 mt-1 w-6 h-6 rounded-full border border-sand-400 flex items-center justify-center text-ink-700 group-open:rotate-45 transition-transform"
                        >
                          <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <line x1="6" y1="2" x2="6" y2="10" />
                            <line x1="2" y1="6" x2="10" y2="6" />
                          </svg>
                        </span>
                      </summary>
                      <div
                        className="mt-3 text-[14.5px] leading-[1.65] text-ink-700 max-w-[60ch] [&_a]:underline [&_a]:underline-offset-2 [&_a]:text-clay-700"
                        dangerouslySetInnerHTML={{
                          __html: t.raw(`sections.${section.key}.${q}.a`) as string,
                        }}
                      />
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 lg:px-14 py-14 lg:py-20 bg-sand-100">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-[28px] lg:text-[36px] text-ink-900 mb-4 -tracking-[0.01em]">
              {t('contact.title')}
            </h2>
            <p className="text-[15px] text-ink-700 mb-7 leading-[1.6]">
              {t('contact.body')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3.5">
              <a
                href="https://wa.me/18094122468"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-sm bg-clay-700 hover:bg-accent-hover text-on-accent text-[12.5px] font-semibold uppercase tracking-wider transition-colors"
              >
                <MessageCircle size={16} strokeWidth={1.8} />
                {t('contact.whatsapp')}
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-sm bg-transparent border border-ink-900 text-ink-900 text-[12.5px] font-semibold uppercase tracking-wider hover:bg-ink-900 hover:text-sand-50 transition-colors"
              >
                <Mail size={16} strokeWidth={1.8} />
                {t('contact.form')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
