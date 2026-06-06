import { Compass, Search } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

export default async function LocaleNotFound() {
  const t = await getTranslations('NotFound')

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />

      <main
        id="main-content"
        className="flex-grow px-6 lg:px-14 py-16 lg:py-24 max-w-3xl mx-auto w-full flex flex-col items-center text-center"
      >
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-clay-700 font-semibold mb-5">
          {t('eyebrow')}
        </div>

        <div
          aria-hidden
          className="font-serif italic text-[120px] md:text-[160px] leading-none -tracking-[0.02em] text-clay-400 mb-6 select-none"
        >
          404
        </div>

        <h1 className="font-serif text-[36px] md:text-[48px] leading-[1.05] -tracking-[0.01em] text-ink-900 mb-5 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-700">
          {t.rich('title', {
            em: (chunks) => <em>{chunks}</em>,
          })}
        </h1>

        <p className="text-[15.5px] leading-[1.7] text-ink-700 max-w-lg mb-10">
          {t('description')}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-sm bg-clay-700 text-on-accent text-[13px] font-semibold uppercase tracking-wider hover:bg-clay-800 transition-colors"
          >
            <Search size={16} strokeWidth={1.8} />
            {t('primaryCta')}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-sm bg-transparent border border-ink-900 text-ink-900 text-[13px] font-semibold uppercase tracking-wider hover:bg-ink-900 hover:text-sand-50 transition-colors"
          >
            <Compass size={16} strokeWidth={1.8} />
            {t('ghostCta')}
          </Link>
        </div>

        <div className="mt-14 pt-8 border-t border-sand-300 w-full max-w-md">
          <p className="text-[12.5px] text-ink-500 mb-4 uppercase tracking-[0.14em] font-mono">
            {t('quickLinksHeading')}
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13.5px]">
            <Link href="/marques" className="text-ink-700 hover:text-clay-700 border-b border-transparent hover:border-current pb-0.5 transition-colors">
              {t('quickLinks.brands')}
            </Link>
            <Link href="/favoris" className="text-ink-700 hover:text-clay-700 border-b border-transparent hover:border-current pb-0.5 transition-colors">
              {t('quickLinks.favorites')}
            </Link>
            <Link href="/contact" className="text-ink-700 hover:text-clay-700 border-b border-transparent hover:border-current pb-0.5 transition-colors">
              {t('quickLinks.contact')}
            </Link>
            <Link href="/a-propos" className="text-ink-700 hover:text-clay-700 border-b border-transparent hover:border-current pb-0.5 transition-colors">
              {t('quickLinks.about')}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
