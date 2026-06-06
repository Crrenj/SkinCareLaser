/**
 * Titre de bannière : autorise UNIQUEMENT `<em>`/`<strong>`/`<br>` (le pivot
 * italique est un design documenté) et retire tout autre HTML. Anti-XSS stocké
 * (le titre vient de la DB, éditable par l'admin). [C-54]
 *
 * Implémentation SANS dépendance (plus de DOMPurify/jsdom) : on échappe TOUT le
 * HTML, puis on restaure uniquement les 3 balises autorisées, sans attribut.
 * Toute balise avec attribut/autre nom reste échappée (inerte) car le motif
 * exige `>` immédiatement après le nom de balise. Évite de charger jsdom côté
 * serveur (le home rendait 500 en Node 20 : html-encoding-sniffer require()
 * @exodus/bytes désormais ESM-only → ERR_REQUIRE_ESM). [fix home 500]
 */
export function sanitizeBannerTitle(title: string): string {
  const escaped = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  return escaped
    .replace(/&lt;(\/?)(em|strong)&gt;/gi, '<$1$2>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
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
