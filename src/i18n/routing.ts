import { defineRouting } from 'next-intl/routing'

/**
 * Configuration i18n FARMAU.
 *
 * Locales :
 *   - fr (défaut, langue d'origine des strings)
 *   - es (marché principal République Dominicaine)
 *   - en (international)
 *
 * URLs : toujours préfixées (`/fr/...`, `/es/...`, `/en/...`) pour des
 * raisons SEO (hreflang clean + canonicals distincts). Le middleware
 * redirige `/` vers la langue préférée du navigateur.
 */
export const routing = defineRouting({
  locales: ['fr', 'es', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always',
})
