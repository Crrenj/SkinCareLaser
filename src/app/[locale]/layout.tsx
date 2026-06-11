import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale, getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { CookieBanner } from '@/components/CookieBanner'
import { AppHtmlShell } from '@/components/AppHtmlShell'

/**
 * ROOT layout de la branche publique `/(fr|es|en)/*` (plus de layout racine
 * commun — cf. AppHtmlShell). La locale vient du segment URL, donc le
 * `<html lang>` est exact ET statique : c'est ce qui rend le SSG/ISR
 * possible sur les pages publiques (l'ancien root layout `getLocale()`
 * forçait tout en dynamique).
 */

// siteName en dur (pas via getShopSettings) : lire shop_settings ici avec le
// client cookies forcerait le rendu dynamique. La valeur 'FARMAU' correspond
// au shop_name réel.
export const metadata: Metadata = {
  title: "FARMAU — Dermo-cosmétique d'expert pharmacien",
  description: "Sélection dermo-cosmétique curatée par des pharmaciens. Click & collect en République Dominicaine.",
  metadataBase: new URL('https://farmau.do'),
  openGraph: {
    siteName: 'FARMAU',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  // Phase 4 (remédiation 2026-06-10) : le namespace `Admin` (~33 ko minifiés,
  // 35 % du payload i18n) n'est JAMAIS consommé côté public (0 usage vérifié)
  // — l'admin a son propre provider (admin/layout.tsx) qui garde les messages
  // complets. On le retire du payload sérialisé vers le client public.
  // `getTranslations` serveur lit la config request (pas ce provider) → intact.
  const { Admin: _admin, ...publicMessages } = messages as Record<string, unknown>

  return (
    <AppHtmlShell lang={locale}>
      <NextIntlClientProvider
        locale={locale}
        messages={publicMessages as Parameters<typeof NextIntlClientProvider>[0]['messages']}
      >
        {children}
        <CookieBanner />
      </NextIntlClientProvider>
    </AppHtmlShell>
  )
}
