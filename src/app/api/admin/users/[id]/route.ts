import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * PATCH /api/admin/users/[id]
 * Body : { isAdmin: boolean }
 *
 * Promeut ou rétrograde un utilisateur en admin (insert/delete dans
 * admin_users, source de vérité RLS). Garde-fou : un admin ne peut
 * pas se retirer lui-même les droits.
 */
export async function PATCH(
  request: NextRequest,
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

  let body: { isAdmin?: boolean } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (typeof body.isAdmin !== 'boolean') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Garde-fou : empêcher la rétrogradation auto
  if (!body.isAdmin && id === auth.userId) {
    return NextResponse.json({ error: 'cannot_demote_self' }, { status: 400 })
  }

  if (body.isAdmin) {
    const { error } = await supabaseAdmin
      .from('admin_users')
      .upsert({ user_id: id }, { onConflict: 'user_id', ignoreDuplicates: true })
    if (error) {
      console.error('[/api/admin/users/[id]] upsert error', error)
      return NextResponse.json({ error: 'upsert_failed' }, { status: 500 })
    }
  } else {
    const { error } = await supabaseAdmin.from('admin_users').delete().eq('user_id', id)
    if (error) {
      console.error('[/api/admin/users/[id]] delete error', error)
      return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
    }
  }

  // Synchronise la colonne profiles.is_admin par cohérence (legacy)
  await supabaseAdmin
    .from('profiles')
    .update({ is_admin: body.isAdmin })
    .eq('id', id)

  return NextResponse.json({ ok: true, isAdmin: body.isAdmin })
}
