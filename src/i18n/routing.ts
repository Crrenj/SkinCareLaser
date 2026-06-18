import { defineRouting } from 'next-intl/routing'

/**
 * Configuration i18n FARMAU.
 *
 * Locales :
 *   - es (DÉFAUT — marché principal République Dominicaine)
 *   - fr (langue d'origine des strings)
 *   - en (international)
 *
 * URLs : toujours préfixées (`/es/...`, `/fr/...`, `/en/...`) pour des
 * raisons SEO (hreflang clean + canonicals distincts).
 *
 * `localeDetection: false` : on N'utilise PAS la langue du navigateur. `/`
 * redirige TOUJOURS vers `/es` (espagnol par défaut partout), quel que soit
 * l'Accept-Language. Les visiteurs basculent ensuite via le LocaleSwitcher
 * (une locale explicite dans l'URL est toujours respectée).
 */
export const routing = defineRouting({
  locales: ['fr', 'es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
  localeDetection: false,
})
