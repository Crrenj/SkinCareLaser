import { toLocaleTag } from './constants'

type FormatPriceOptions = {
  /** Code next-intl (`fr`|`es`|`en`) ou tag BCP-47 direct. Défaut : `es-DO`. */
  locale?: string
  /** Nombre de chiffres après la virgule (min/max). Défaut 0 (DOP = pesos entiers). */
  fractionDigits?: number
}

/**
 * Formate un nombre comme prix sans suffixe devise.
 * L'UI ajoute généralement « DOP » dans un <span> séparé pour la typo.
 * Le DOP s'affiche en pesos entiers (0 décimale) par convention boutique.
 *
 * @example
 *   formatPrice(1234.5)                       // "1,235"
 *   formatPrice(1234, { locale: 'fr' })       // "1 234"
 *   formatPrice(1234.5, { fractionDigits: 2 }) // "1,234.50"
 */
export function formatPrice(value: number, options: FormatPriceOptions = {}): string {
  const { locale, fractionDigits = 0 } = options
  return new Intl.NumberFormat(toLocaleTag(locale), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}
