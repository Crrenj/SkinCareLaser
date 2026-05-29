/**
 * Registre canonique des sections de la page d'accueil.
 *
 * C'est la SOURCE DE VÉRITÉ de "quelles sections existent" → elles sont donc
 * NON SUPPRIMABLES (l'admin ne peut que réordonner / afficher-masquer).
 * L'ordre + la visibilité sont stockés dans `shop_settings.home_layout` (JSONB) ;
 * ce module ne fait que définir l'ensemble fixe et normaliser la valeur stockée.
 *
 * Pur (pas de dépendance DB / server-only) → importable côté serveur (rendu
 * de la home) ET côté client (panneau admin de réordonnancement).
 */

export const HOME_SECTION_KEYS = [
  'hero',
  'bestsellers',
  'byNeed',
  'quote',
  'brands',
  'expertise',
  'routine',
  'banners',
] as const

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number]

export type HomeLayoutEntry = { key: HomeSectionKey; enabled: boolean }

const KEY_SET: ReadonlySet<string> = new Set(HOME_SECTION_KEYS)

/** Agencement par défaut = ordre historique de la home, tout visible. */
export const DEFAULT_HOME_LAYOUT: HomeLayoutEntry[] = HOME_SECTION_KEYS.map((key) => ({
  key,
  enabled: true,
}))

/**
 * Normalise la valeur brute (JSONB stocké, potentiellement null/invalide) en
 * un layout valide :
 *  - conserve l'ordre stocké pour les clés connues ;
 *  - ignore les clés inconnues (anciennes sections supprimées du code) ;
 *  - ajoute en fin les sections du registre absentes du stockage (visibles)
 *    → robuste quand on ajoute une nouvelle section au code plus tard.
 */
export function resolveHomeLayout(raw: unknown): HomeLayoutEntry[] {
  const seen = new Set<HomeSectionKey>()
  const out: HomeLayoutEntry[] = []

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue
      const key = (item as { key?: unknown }).key
      if (typeof key !== 'string' || !KEY_SET.has(key)) continue
      const typedKey = key as HomeSectionKey
      if (seen.has(typedKey)) continue
      out.push({ key: typedKey, enabled: (item as { enabled?: unknown }).enabled !== false })
      seen.add(typedKey)
    }
  }

  for (const key of HOME_SECTION_KEYS) {
    if (!seen.has(key)) out.push({ key, enabled: true })
  }

  return out
}
