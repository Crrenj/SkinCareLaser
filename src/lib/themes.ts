/**
 * Catalogue des thèmes FARMAU (cf. handoff `design_handoff_themes_system/`).
 * Source unique pour : l'écran admin `/admin/apariencia`, le reader serveur
 * `getThemeConfig`, et la validation Zod. Les valeurs CSS (rampe complète)
 * vivent dans `globals.css` ([data-theme][data-mode]).
 *
 * Les couleurs `favicon` (disque + oiseau) sont aussi répliquées dans
 * `scripts/build-favicons.cjs` (garder en phase).
 */

export const THEME_NAMES = ['terra', 'noir', 'botanico', 'coral', 'marino', 'ambar'] as const
export type ThemeName = (typeof THEME_NAMES)[number]

export const THEME_MODES = ['light', 'dark', 'system'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

export function isThemeName(v: unknown): v is ThemeName {
  return typeof v === 'string' && (THEME_NAMES as readonly string[]).includes(v)
}
export function isThemeMode(v: unknown): v is ThemeMode {
  return typeof v === 'string' && (THEME_MODES as readonly string[]).includes(v)
}

export interface ThemeMeta {
  slug: ThemeName
  /** Nom propre affiché (non traduit). */
  name: string
  /** Descripteur typographique mono (ex. « sand · clay · ink »). */
  descMini: string
  /** Trio de pastilles : fond clair · sombre · accent. */
  swatches: [string, string, string]
  /** Couleurs du favicon officiel (disque + oiseau). */
  favicon: { disc: string; bird: string }
}

export const THEMES: ThemeMeta[] = [
  {
    slug: 'terra',
    name: 'Terra',
    descMini: 'sand · clay · ink',
    swatches: ['#FBF8F4', '#1F1B16', '#B86F4A'],
    favicon: { disc: '#1F1B16', bird: '#FBF8F4' },
  },
  {
    slug: 'noir',
    name: 'Noir',
    descMini: 'paper · ink',
    swatches: ['#FFFFFF', '#0A0A0A', '#1F1B16'],
    favicon: { disc: '#0A0A0A', bird: '#FFFFFF' },
  },
  {
    slug: 'botanico',
    name: 'Botánico',
    descMini: 'cream · forest · olive',
    swatches: ['#F5F2EA', '#1E2418', '#5B6B3F'],
    favicon: { disc: '#5B6B3F', bird: '#F5F2EA' },
  },
  {
    slug: 'coral',
    name: 'Coral',
    descMini: 'peach · cocoa · clay',
    swatches: ['#FBF2EC', '#2E1810', '#B86F4A'],
    favicon: { disc: '#B86F4A', bird: '#FBF2EC' },
  },
  {
    slug: 'marino',
    name: 'Marino',
    descMini: 'mist · navy · teal',
    swatches: ['#F0F4F5', '#0F1B22', '#3D6B7A'],
    favicon: { disc: '#3D6B7A', bird: '#F0F4F5' },
  },
  {
    slug: 'ambar',
    name: 'Ámbar',
    descMini: 'vellum · bronze · ochre',
    swatches: ['#FAF4E6', '#2A2014', '#B5852B'],
    favicon: { disc: '#B5852B', bird: '#FAF4E6' },
  },
]

export const THEME_BY_SLUG: Record<ThemeName, ThemeMeta> = Object.fromEntries(
  THEMES.map((t) => [t.slug, t]),
) as Record<ThemeName, ThemeMeta>
