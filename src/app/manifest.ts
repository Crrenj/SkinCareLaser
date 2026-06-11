import type { MetadataRoute } from 'next'

/**
 * Manifest PWA minimal (Phase 9, audit 2026-06-10) : installabilité de base +
 * identité visuelle dans les ambiances navigateur. Icônes = set Terra (thème
 * par défaut — le manifest est statique, le favicon par thème reste géré en
 * live par ThemeFavicon). Pas de service worker : simple web app installable.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FARMAU — Dermo-cosmétique',
    short_name: 'FARMAU',
    description:
      'Sélection dermo-cosmétique curatée par des pharmaciens. Click & collect en République Dominicaine.',
    start_url: '/fr',
    display: 'standalone',
    background_color: '#FAF6F0',
    theme_color: '#8A4B2D',
    icons: [
      { src: '/favicons/terra-64.png', sizes: '64x64', type: 'image/png' },
      { src: '/favicons/terra-180.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
