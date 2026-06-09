import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, stockLossBody } from '@/lib/schemas'
import { recordAuditLog } from '@/lib/audit'

/**
 * POST — enregistre une perte de stock (merma / producto vencido).
 *
 * Décrémente products.stock (clamp ≥ 0, ignore stock NULL) ET crée une charge
 * P&L au coût (CMP) en catégorie « merma » via la RPC `record_stock_loss`
 * (atomique, idempotente par `client_token`). Le coût est lu côté serveur ;
 * ne touche jamais cost_price ni stock_entries. created_by = admin courant.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const parsed = parseBody(stockLossBody, raw)
  if (!parsed.ok) return parsed.response
  const { client_token, product_id, quantity, reason, note } = parsed.data

  const { error } = await supabaseAdmin.rpc('record_stock_loss', {
    p_product_id: product_id,
    p_quantity: quantity,
    p_reason: reason,
    p_note: note?.trim() ? note.trim() : null,
    p_created_by: auth.userId,
    p_client_token: client_token,
  })

  if (error) {
    logger.error('[admin/stock/loss] RPC error:', error)
    return apiError("Erreur lors de l'enregistrement de la merma", error, 500)
  }

  recordAuditLog({
    actorId: auth.userId,
    action: 'create',
    entity: 'merma',
    entityId: product_id,
    summary: `Merma (${reason}): ${quantity} uds`,
    diff: { product_id, quantity, reason },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
