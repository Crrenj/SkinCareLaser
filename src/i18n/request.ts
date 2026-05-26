import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export const ADMIN_LOCALE_COOKIE = 'farmau_admin_locale'

/**
 * Charge les messages de traduction pour la locale demandée.
 *
 * Deux sources :
 *   1. `requestLocale` (segment `[locale]` URL) — utilisé par les pages
 *      publiques `/fr/...`, `/es/...`, `/en/...`.
 *   2. Cookie `farmau_admin_locale` — utilisé par les pages /admin/* qui
 *      n'ont pas de segment locale dans l'URL. Permet à l'admin de
 *      basculer la langue sans changer d'URL.
 *
 * Fallback final : `routing.defaultLocale` (fr).
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  let locale: string

  if (hasLocale(routing.locales, requested)) {
    locale = requested
  } else {
    const cookieLocale = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value
    locale = hasLocale(routing.locales, cookieLocale)
      ? cookieLocale
      : routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
