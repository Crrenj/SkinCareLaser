import { NextResponse } from 'next/server'
import { getThemeConfig } from '@/lib/getThemeConfig'

/**
 * GET /api/theme — thème d'apparence courant (public, lecture seule).
 *
 * Source unique pour le favicon côté client (`ThemeFavicon`) afin qu'il reflète
 * TOUJOURS le thème défini dans `/admin/apariencia`, indépendamment de la
 * fraîcheur du `<html data-theme>` baké au build par chaque page SSG.
 * `getThemeConfig` est wrappé dans `unstable_cache` (tag `shop-theme-config`,
 * invalidé par le save apparence). On met `no-store` sur la RÉPONSE : pas de
 * cache CDN (sinon le thème resterait périmé jusqu'à 5 min après un changement,
 * `revalidateTag` ne purgeant pas le cache edge). La fraîcheur + le faible coût
 * viennent de l'`unstable_cache` côté origine. RLS : SELECT public sur
 * `shop_settings`.
 */
export async function GET() {
  const { theme } = await getThemeConfig()
  return NextResponse.json(
    { theme },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
