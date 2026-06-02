import { NextResponse } from 'next/server'
import { getThemeConfig } from '@/lib/getThemeConfig'

/**
 * GET /api/theme — thème d'apparence courant (public, lecture seule).
 *
 * Source unique pour le favicon côté client (`ThemeFavicon`) afin qu'il reflète
 * TOUJOURS le thème défini dans `/admin/apariencia`, indépendamment de la
 * fraîcheur du `<html data-theme>` baké au build par chaque page SSG.
 * `getThemeConfig` est wrappé dans `unstable_cache` (tag `shop-theme-config`,
 * invalidé par le save apparence) et n'utilise pas `cookies()` → cette route
 * reste cacheable (pas forcée dynamic). RLS : SELECT public sur `shop_settings`.
 */
export async function GET() {
  const { theme } = await getThemeConfig()
  return NextResponse.json(
    { theme },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    },
  )
}
