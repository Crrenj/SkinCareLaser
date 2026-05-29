import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { requireAdmin, getAdminRole, type AdminRole } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/admin/admins
 *
 * Liste l'équipe admin (uniquement les membres de `admin_users`) avec leur
 * rôle, enrichie nom/email/téléphone. Renvoie aussi `currentUser:{id,role}`
 * pour que le client sache s'il peut afficher les contrôles de gestion.
 *
 * Lecture ouverte à TOUT admin (`requireAdmin`) ; les mutations (promote /
 * révoque / change de rôle) passent par PATCH /api/admin/users/[id] qui est
 * super-admin only.
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  const { data: adminRows, error } = await supabaseAdmin
    .from('admin_users')
    .select('user_id, role, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('[/api/admin/admins] list error', error)
    return NextResponse.json({ error: 'list_failed' }, { status: 500 })
  }

  const ids = (adminRows ?? []).map((a) => a.user_id)
  const adminIds = new Set(ids)

  // Profils (nom, téléphone) en batch.
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, display_name, phone')
    .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  // Emails : auth.admin.listUsers ne filtre pas par id → on parcourt les pages
  // et on ne retient que les admins. Base d'utilisateurs petite (cap 10 pages).
  const emailById = new Map<string, string | null>()
  const perPage = 200
  for (let page = 1; page <= 10 && emailById.size < adminIds.size; page++) {
    const { data: pageData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    })
    if (listErr) {
      logger.error('[/api/admin/admins] listUsers error', listErr)
      break
    }
    for (const u of pageData.users) {
      if (adminIds.has(u.id)) emailById.set(u.id, u.email ?? null)
    }
    if (pageData.users.length < perPage) break
  }

  const admins = (adminRows ?? []).map((a) => {
    const p = profileById.get(a.user_id) ?? null
    const role: AdminRole = a.role === 'super_admin' ? 'super_admin' : 'admin'
    return {
      id: a.user_id,
      email: emailById.get(a.user_id) ?? null,
      firstName: p?.first_name ?? null,
      lastName: p?.last_name ?? null,
      displayName: p?.display_name ?? null,
      phone: p?.phone ?? null,
      role,
      createdAt: a.created_at,
    }
  })

  const currentUserRole = await getAdminRole(auth.userId)

  return NextResponse.json({
    admins,
    currentUser: { id: auth.userId, role: currentUserRole },
  })
}
