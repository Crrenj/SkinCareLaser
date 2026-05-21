import { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { LegalSidebar } from './LegalSidebar'

interface LegalShellProps {
  eyebrow: string
  title: string
  lastUpdatedISO: string
  intro?: string
  children: ReactNode
  /** Slug courant pour activer l'item de la sidebar : `cgv`, `mentions-legales`, etc. */
  activeSlug: 'cgv' | 'mentions-legales' | 'confidentialite' | 'cookies'
}

/**
 * Shell partagé pour les 4 pages /legal/*.
 * Inclut NavBar/Footer, sidebar de nav latérale (sticky desktop), disclaimer
 * en tête, en-tête éditorial + date de mise à jour.
 */
export async function LegalShell({
  eyebrow,
  title,
  lastUpdatedISO,
  intro,
  children,
  activeSlug,
}: LegalShellProps) {
  const t = await getTranslations('Legal.shell')

  const formatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(lastUpdatedISO))

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />

      <main id="main-content" className="flex-grow">
        <div className="max-w-7xl mx-auto px-6 lg:px-14 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-10 lg:gap-14">
            <LegalSidebar activeSlug={activeSlug} />

            <article className="min-w-0">
              <header className="mb-10 pb-8 border-b border-sand-300">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-clay-700 font-semibold mb-3">
                  {eyebrow}
                </div>
                <h1 className="font-serif text-[36px] lg:text-[48px] text-ink-900 leading-[1.05] -tracking-[0.015em] mb-4">
                  {title}
                </h1>
                <p className="text-[12.5px] text-ink-500 uppercase tracking-[0.1em] font-mono">
                  {t('lastUpdated')} <time dateTime={lastUpdatedISO}>{formatted}</time>
                </p>
                {intro && (
                  <p className="mt-5 text-[15.5px] leading-[1.65] text-ink-700 max-w-prose">
                    {intro}
                  </p>
                )}
              </header>

              {/* Disclaimer : ces documents sont génériques et doivent être
                  validés par un juriste local avant prod publique. */}
              <aside
                role="note"
                className="mb-10 flex gap-3 px-5 py-4 rounded-md bg-clay-50 border-l-4 border-clay-700"
              >
                <AlertTriangle
                  size={20}
                  strokeWidth={1.7}
                  className="shrink-0 mt-0.5 text-clay-700"
                />
                <div className="text-[13.5px] leading-[1.55] text-ink-800">
                  <strong className="font-semibold">{t('disclaimerTitle')}</strong>{' '}
                  {t('disclaimerBody')}
                </div>
              </aside>

              <div className="prose-legal max-w-[68ch]">{children}</div>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
