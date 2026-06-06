/**
 * Convertit un nom en slug URL-safe : lowercase, accents retirés, kebab-case,
 * trim tirets en bordure. Utilisé partout où on génère un slug automatiquement
 * depuis un nom utilisateur (produits, marques, gammes, tags, bannières, ...).
 *
 * Garantit un slug NON VIDE : un nom 100 % non-latin (ex. « 日本語 ») se
 * réduirait sinon à '' et déclencherait une collision/erreur sur les index
 * UNIQUE (audit C-09). On retombe alors sur un suffixe court unique.
 */
export function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return slug || `item-${Date.now().toString(36)}`
}
