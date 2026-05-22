/**
 * Convertit un nom en slug URL-safe : lowercase, accents retirés, kebab-case,
 * trim tirets en bordure. Utilisé partout où on génère un slug automatiquement
 * depuis un nom utilisateur (produits, marques, gammes, tags, bannières, ...).
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
