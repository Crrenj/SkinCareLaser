import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, promotionUpdate } from '@/lib/schemas'
import { recordAuditLog } from '@/lib/audit'
import { validatePromotionTargets } from '../_helpers'

// PATCH — met à jour une promo + remplace ses cibles (swap atomique via RPC).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }
  const sb = supabaseAdmin

  const { id } = await params
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  // id de l'URL fait foi (le body en porte un par cohérence du schéma).
  const parsed = parseBody(promotionUpdate, { ...(raw as object), id })
  if (!parsed.ok) return parsed.response
  const { name, discount_type, discount_value, start_date, end_date, is_active, priority, targets } =
    parsed.data

  if (!(await validatePromotionTargets(sb, targets))) {
    return NextResponse.json({ error: 'invalid_target' }, { status: 400 })
  }

  const { error } = await sb
    .from('promotions')
    .update({
      name: name.trim(),
      discount_type,
      discount_value,
      start_date,
      end_date,
      is_active: is_active ?? true,
      priority: priority ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return apiError('Erreur lors de la mise à jour de la promotion', error, 500)

  const { error: targetsErr } = await sb.rpc('set_promotion_targets', {
    p_promotion_id: id,
    p_targets: targets,
  })
  if (targetsErr) return apiError('Erreur lors de l\'enregistrement des objectifs', targetsErr, 500)

  recordAuditLog({
    actorId: auth.userId,
    action: 'update',
    entity: 'promotion',
    entityId: id,
    summary: `Promoción actualizada: ${name.trim()}`,
    diff: { name: name.trim(), discount_type, discount_value, start_date, end_date, is_active, targets },
  })

  return NextResponse.json({ id })
}

// DELETE — supprime une promo (les cibles partent en cascade).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const { id } = await params
  const { error } = await supabaseAdmin.from('promotions').delete().eq('id', id)
  if (error) return apiError('Erreur lors de la suppression de la promotion', error, 500)

  recordAuditLog({
    actorId: auth.userId,
    action: 'delete',
    entity: 'promotion',
    entityId: id,
    summary: `Promoción eliminada (${id.slice(0, 8)})`,
    diff: { id },
  })

  return NextResponse.json({ ok: true })
}
