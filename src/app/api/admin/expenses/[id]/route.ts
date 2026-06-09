import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, expenseDelete } from '@/lib/schemas'
import { recordAuditLog } from '@/lib/audit'

/** DELETE — supprime une dépense par id. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const { id } = await params
  const parsed = parseBody(expenseDelete, { id })
  if (!parsed.ok) return parsed.response

  const { error } = await supabaseAdmin.from('expenses').delete().eq('id', parsed.data.id)
  if (error) {
    logger.error('[admin/expenses] DELETE error:', error)
    return apiError('Erreur lors de la suppression', error, 500)
  }

  recordAuditLog({
    actorId: auth.userId,
    action: 'delete',
    entity: 'expense',
    entityId: parsed.data.id,
    summary: `Gasto eliminado (${parsed.data.id.slice(0, 8)})`,
    diff: { id: parsed.data.id },
  })

  return NextResponse.json({ ok: true })
}
