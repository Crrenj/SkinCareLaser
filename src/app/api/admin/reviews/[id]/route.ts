import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { reviewModerate } from '@/lib/schemas'
import { recordAuditLog } from '@/lib/audit'

/**
 * PATCH /api/admin/reviews/[id]  { status }
 *   → modère un avis (approve/reject/repasse en pending). requireAdmin.
 * DELETE /api/admin/reviews/[id]
 *   → supprime définitivement un avis. requireAdmin.
 *
 * CSRF géré par requireAdmin (assertOriginFromHeaders).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'server_misconfig' }, { status: 500 })
  }

  const { id } = await params

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = reviewModerate.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('reviews')
    .update({ status: parsed.data.status })
    .eq('id', id)

  if (error) {
    logger.error('[/api/admin/reviews/[id] PATCH]', error)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }

  recordAuditLog({
    actorId: auth.userId,
    action: 'update',
    entity: 'review',
    entityId: id,
    summary: `Reseña ${id.slice(0, 8)} → ${parsed.data.status}`,
    diff: { status: parsed.data.status },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'server_misconfig' }, { status: 500 })
  }

  const { id } = await params

  const { error } = await supabaseAdmin.from('reviews').delete().eq('id', id)
  if (error) {
    logger.error('[/api/admin/reviews/[id] DELETE]', error)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  recordAuditLog({
    actorId: auth.userId,
    action: 'delete',
    entity: 'review',
    entityId: id,
    summary: `Reseña eliminada (${id.slice(0, 8)})`,
    diff: { id },
  })

  return NextResponse.json({ ok: true })
}
