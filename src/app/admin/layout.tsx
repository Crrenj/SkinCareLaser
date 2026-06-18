import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { AdminShell } from './_AdminShell'
import { AppHtmlShell } from '@/components/AppHtmlShell'
import { getShopSettings } from '@/lib/getShopSettings'

/**
 * ROOT layout de la branche `/admin/*` (plus de layout racine commun — cf.
 * AppHtmlShell). La locale est résolue dans `i18n/request.ts` :
 *   - cookie `farmau_admin_locale` si défini
 *   - sinon `routing.defaultLocale`
 * → lecture de cookies = rendu dynamique, ASSUMÉ ici (l'admin est gated et
 * n'a aucun intérêt ISR ; seules les pages publiques devaient être libérées).
 *
 * Le bouton FR/ES/EN du header admin pose ce cookie via
 * `/api/admin/set-locale` puis `router.refresh()` pour recharger les
 * messages serveur sans changer d'URL.
 */

export const metadata: Metadata = {
  title: 'FARMAU — Admin',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  // Taux de remise employé affiché à tous les admins (bande du shell). Lu via
  // getShopSettings (cookieless + unstable_cache) → pas de fetch client.
  const shop = await getShopSettings()

  return (
    <AppHtmlShell lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <AdminShell employeeDiscountPct={Number(shop.employee_discount_pct) || 0}>{children}</AdminShell>
      </NextIntlClientProvider>
    </AppHtmlShell>
  )
}
