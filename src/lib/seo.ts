import { routing } from '@/i18n/routing'

/**
 * Helpers SEO pour générer canonical + hreflang alternates.
 *
 * Utilisation type dans une page Server Component :
 *
 *   export async function generateMetadata({ params }): Promise<Metadata> {
 *     const { locale } = await params
 *     const t = await getTranslations({ locale, namespace: 'PageMeta.home' })
 *     return {
 *       title: t('title'),
 *       description: t('description'),
 *       alternates: {
 *         canonical: localizedPath(locale, '/'),
 *         languages: buildLanguageAlternates('/'),
 *       },
 *     }
 *   }
 *
 * Les URLs sont relatives au `metadataBase` du root layout (https://farmau.do).
 */

/** Renvoie le path préfixé par la locale. `'/'` reste `'/<locale>'`. */
export function localizedPath(locale: string, path: string): string {
  if (path === '/' || path === '') return `/${locale}`
  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Renvoie la map `alternates.languages` pour toutes les locales du routing.
 * `x-default` pointe vers la locale par défaut (fr).
 */
export function buildLanguageAlternates(path: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const loc of routing.locales) {
    map[loc] = localizedPath(loc, path)
  }
  map['x-default'] = localizedPath(routing.defaultLocale, path)
  return map
}
