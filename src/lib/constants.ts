/**
 * Constantes métier partagées (devise, locale, seuils stock, chemins admin).
 * Source unique de vérité pour éviter les magic strings dispersés.
 */

export const DEFAULT_CURRENCY = 'DOP' as const

/** Tag BCP-47 par défaut pour Intl.NumberFormat / DateTimeFormat. */
export const DEFAULT_LOCALE_TAG = 'es-DO'

/** Seuil sous lequel un produit est considéré "stock bas" dans l'admin. */
export const LOW_STOCK_THRESHOLD = 10

/** Quantité maximale autorisée par ligne panier. */
export const MAX_CART_QUANTITY = 99

/** Tableau de bord admin (landing post-login, avec les stats). */
export const ADMIN_HOME_PATH = '/admin'

/** Mapping locale next-intl (`fr`|`es`|`en`) → tag BCP-47 pour Intl. */
export const LOCALE_TAG_MAP: Record<string, string> = {
  fr: 'fr-FR',
  es: 'es-DO',
  en: 'en-US',
}

/**
 * Convertit un code locale (`fr`|`es`|`en` next-intl) ou un tag BCP-47 direct
 * en tag utilisable par Intl. Fallback : DEFAULT_LOCALE_TAG.
 */
export function toLocaleTag(locale: string | undefined): string {
  if (!locale) return DEFAULT_LOCALE_TAG
  if (locale.includes('-')) return locale
  return LOCALE_TAG_MAP[locale] ?? DEFAULT_LOCALE_TAG
}
