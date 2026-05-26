import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { AdminShell } from './_AdminShell'

/**
 * Wrap les pages /admin/* avec un `NextIntlClientProvider` alimenté par
 * `getMessages()`. La locale est résolue dans `i18n/request.ts` :
 *   - cookie `farmau_admin_locale` si défini
 *   - sinon `routing.defaultLocale`
 *
 * Le bouton FR/ES/EN dans la sidebar pose ce cookie via
 * `/api/admin/set-locale` puis `router.refresh()` pour recharger les
 * messages serveur sans changer d'URL.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AdminShell>{children}</AdminShell>
    </NextIntlClientProvider>
  )
}
