import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/** DELETE /api/admin/newsletter/[id] — supprime un abonné par id. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('[/api/admin/newsletter/[id]] delete error', error)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
