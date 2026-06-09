import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, homeLayoutBody } from '@/lib/schemas'
import { resolveHomeLayout } from '@/lib/homeSections'
import { logger } from '@/lib/logger'
import { recordAuditLog } from '@/lib/audit'
import type { Database, Json } from '@/lib/database.types'

type ShopSettingsUpdate = Database['public']['Tables']['shop_settings']['Update']

/**
 * GET — ordre + visibilité actuels des sections de la home (résolus contre le
 * registre canonique, donc toujours complets même si le stockage est partiel).
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('shop_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    logger.error('GET /api/admin/home-layout:', error)
    return apiError('Erreur serveur', error, 500)
  }

  // home_layout : colonne JSONB (migration 20260529095909), lue via cast.
  const raw = (data as { home_layout?: unknown } | null)?.home_layout
  return NextResponse.json({ layout: resolveHomeLayout(raw) })
}

/** PATCH — enregistre le nouvel ordre/visibilité et revalide la home. */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const parsed = parseBody(homeLayoutBody, await req.json())
  if (!parsed.ok) return parsed.response

  // Re-normalise (dédup + complète les sections manquantes) avant d'écrire.
  const layout = resolveHomeLayout(parsed.data.layout)

  const { error } = await supabaseAdmin
    .from('shop_settings')
    // cast : home_layout (JSONB) hors des types générés actuels.
    .update({ home_layout: layout } as unknown as ShopSettingsUpdate)
    .eq('id', 1)

  if (error) {
    logger.error('PATCH /api/admin/home-layout:', error)
    return apiError('Erreur serveur', error, 500)
  }

  for (const locale of ['fr', 'es', 'en']) revalidatePath(`/${locale}`)

  recordAuditLog({
    actorId: auth.userId,
    action: 'update',
    entity: 'home_layout',
    entityId: '1',
    summary: 'Disposición de inicio actualizada',
    diff: layout as unknown as Json,
  })

  return NextResponse.json({ ok: true, layout })
}
