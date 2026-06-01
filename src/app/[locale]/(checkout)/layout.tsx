import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { FarmauLockup } from '@/components/brand/FarmauLogo'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'

/**
 * Layout du tunnel (route group `(checkout)`) : chrome volontairement minimale
 * pour les pages transactionnelles (`/reservation`, `/reservation/confirmation/[id]`).
 * Pas de NavBar/Footer marketing — un header logo + un footer slim légal — afin
 * de garder le focus sur la tâche et réduire les sorties. Le `(checkout)`
 * n'ajoute aucun segment d'URL : `/reservation` reste `/reservation`.
 *
 * Garde `<main id="main-content">` (cible du skip-link du root layout).
 */
export default async function CheckoutLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Footer' })

  return (
    <div className="flex flex-col min-h-screen bg-sand-100">
      <header className="border-b border-sand-300 bg-sand-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <FarmauLockup birdSize={40} wordWidth={70} />
          <LocaleSwitcher variant="inline" />
        </div>
      </header>

      <main id="main-content" className="flex-grow">
        {children}
      </main>

      <footer className="border-t border-sand-300 bg-sand-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-[12px] text-ink-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t('bottom.copyright')}</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/legal/cgv" className="transition-colors hover:text-ink-900">
              {t('bottom.terms')}
            </Link>
            <Link
              href="/legal/confidentialite"
              className="transition-colors hover:text-ink-900"
            >
              {t('bottom.privacy')}
            </Link>
            <Link
              href="/legal/mentions-legales"
              className="transition-colors hover:text-ink-900"
            >
              {t('bottom.legal')}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
