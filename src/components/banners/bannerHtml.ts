import DOMPurify from 'isomorphic-dompurify'

/**
 * Titre de bannière : autorise UNIQUEMENT `<em>`/`<strong>`/`<br>` (le pivot
 * italique est un design documenté) et retire tout autre HTML. Anti-XSS stocké
 * (le titre vient de la DB, éditable par l'admin). [C-54]
 */
export function sanitizeBannerTitle(title: string): string {
  return DOMPurify.sanitize(title, {
    ALLOWED_TAGS: ['em', 'strong', 'br'],
    ALLOWED_ATTR: [],
  })
}

/**
 * Résout la cible CTA d'une bannière. [C-55]
 * - URL absolue (http/https) → rendue en `<a>` natif (un `<Link>` next-intl la
 *   préfixerait de la locale → lien cassé).
 * - Chemin interne → on retire un éventuel préfixe de locale (`/es/…`) car le
 *   `<Link>` next-intl le re-préfixe (`/fr/es/…` → 404).
 */
export function resolveBannerCta(href: string): { href: string; external: boolean } {
  if (/^https?:\/\//i.test(href)) return { href, external: true }
  return { href: href.replace(/^\/(fr|es|en)(\/|$)/, '/'), external: false }
}
