import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { appearanceBody, parseBody } from '@/lib/schemas'
import { THEME_CONFIG_TAG } from '@/lib/getThemeConfig'

const SELECT = 'theme, default_mode, allow_visitor_mode, updated_at' as const

/**
 * Apparence du site public (thème + mode par défaut + override visiteur),
 * stockée sur la ligne unique `shop_settings` (id = 1). Admin-only.
 *
 * Au PATCH on invalide le cache `getThemeConfig` (revalidateTag) pour que le
 * `<html data-theme>` du site public reflète le nouveau thème dès le prochain
 * rendu.
 */

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('shop_settings')
      .select(SELECT)
      .eq('id', 1)
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la lecture de l'apparence"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = parseBody(appearanceBody, body)
  if (!parsed.ok) return parsed.response

  try {
    const { data, error } = await supabaseAdmin
      .from('shop_settings')
      .update({ ...parsed.data, updated_by: auth.userId })
      .eq('id', 1)
      .select(SELECT)
      .single()
    if (error) throw error

    // Le thème public est lu via getThemeConfig (unstable_cache) : on invalide.
    revalidateTag(THEME_CONFIG_TAG)

    return NextResponse.json(data)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la sauvegarde de l'apparence"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
