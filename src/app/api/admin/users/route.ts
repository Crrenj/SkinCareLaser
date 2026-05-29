import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getAdminRole } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/admin/users
 *
 * Liste paginée des utilisateurs avec profil + statut admin.
 *
 * Query params :
 *   - page    : numéro de page (défaut 1)
 *   - perPage : taille (défaut 50, max 200)
 *   - search  : filtre email/nom (insensible casse)
 *
 * Implémentation : on récupère la page entière depuis auth.admin.listUsers
 * (qui est la source de vérité de l'email), puis on enrichit avec profiles
 * et admin_users en 2 requêtes batched par id.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(200, Math.max(1, Number(url.searchParams.get('perPage') ?? 50)))
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()

  const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
    page,
    perPage,
  })

  if (usersErr) {
    logger.error('[/api/admin/users] listUsers error', usersErr)
    return NextResponse.json({ error: 'list_failed' }, { status: 500 })
  }

  const allUsers = usersData.users
  const ids = allUsers.map((u) => u.id)

  const [{ data: profiles }, { data: admins }] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, display_name, phone, preferred_locale, created_at')
      .in('id', ids),
    supabaseAdmin.from('admin_users').select('user_id, role').in('user_id', ids),
  ])

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))
  const roleById = new Map(
    (admins ?? []).map((a) => [a.user_id, a.role === 'super_admin' ? 'super_admin' : 'admin'] as const),
  )

  const rows = allUsers.map((u) => {
    const p = profileById.get(u.id) ?? null
    return {
      id: u.id,
      email: u.email ?? null,
      firstName: p?.first_name ?? null,
      lastName: p?.last_name ?? null,
      displayName: p?.display_name ?? null,
      phone: p?.phone ?? null,
      preferredLocale: p?.preferred_locale ?? null,
      isAdmin: roleById.has(u.id),
      role: roleById.get(u.id) ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
    }
  })

  const filtered = search
    ? rows.filter((r) => {
        const haystack = [
          r.email,
          r.firstName,
          r.lastName,
          r.displayName,
          r.phone,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(search)
      })
    : rows

  const currentUserRole = await getAdminRole(auth.userId)

  return NextResponse.json({
    users: filtered,
    page,
    perPage,
    totalForPage: filtered.length,
    currentUser: { id: auth.userId, role: currentUserRole },
  })
}
