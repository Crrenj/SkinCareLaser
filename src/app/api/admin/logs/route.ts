import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * GET /api/admin/logs — journal d'audit paginé (lecture par TOUT admin).
 *
 * Filtres : page, perPage (≤200), entity, action, actor (= actor_id), from/to
 * (YYYY-MM-DD), highImpact ('1'). Tous mappés sur des colonnes indexées et
 * appliqués AVANT le range() → pagination cohérente, sans count exact (coûteux) :
 * Prev/Next pilotés côté client par `rows.length < perPage`.
 *
 * Résolution acteur : les acteurs sont des admins (auth.userId), mais un admin
 * révoqué garde ses lignes historiques → on résout les `actor_id` DISTINCTS de
 * la page (petit set) via profiles (nom) + listUsers (email, scan borné early-exit),
 * jamais le listUsers page-unique de /api/admin/users. NULL actor → « Sistema »
 * (rendu côté client).
 */

const PER_PAGE_MAX = 200

async function resolveDisplay(
  sb: SupabaseClient<Database>,
  ids: string[],
): Promise<Map<string, { email: string | null; name: string | null }>> {
  const map = new Map<string, { email: string | null; name: string | null }>()
  if (ids.length === 0) return map

  const { data: profiles } = await sb
    .from('profiles')
    .select('id, first_name, last_name, display_name')
    .in('id', ids)
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  // Emails : auth.admin.listUsers ne filtre pas par id → scan borné (cap 10 pages),
  // early-exit dès que tous les ids cherchés sont résolus.
  const idSet = new Set(ids)
  const emailById = new Map<string, string | null>()
  const perPage = 200
  for (let pg = 1; pg <= 10 && emailById.size < idSet.size; pg++) {
    const { data: pageData, error } = await sb.auth.admin.listUsers({ page: pg, perPage })
    if (error) {
      logger.error('[/api/admin/logs] listUsers error', error)
      break
    }
    for (const u of pageData.users) if (idSet.has(u.id)) emailById.set(u.id, u.email ?? null)
    if (pageData.users.length < perPage) break
  }

  for (const id of ids) {
    const p = profileById.get(id)
    const name =
      p?.display_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || null
    map.set(id, { email: emailById.get(id) ?? null, name })
  }
  return map
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }
  const sb = supabaseAdmin

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(PER_PAGE_MAX, Math.max(1, Number(url.searchParams.get('perPage') ?? 50)))
  const entity = url.searchParams.get('entity')
  const action = url.searchParams.get('action')
  const actorId = url.searchParams.get('actor')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const highImpact = url.searchParams.get('highImpact') === '1'

  const offset = (page - 1) * perPage
  let query = sb
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (entity) query = query.eq('entity', entity)
  if (action) query = query.eq('action', action)
  if (actorId) query = query.eq('actor_id', actorId)
  if (highImpact) query = query.eq('is_high_impact', true)
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) query = query.gte('created_at', from)
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) query = query.lte('created_at', `${to}T23:59:59.999Z`)

  const { data: logRows, error } = await query
  if (error) {
    logger.error('[/api/admin/logs] list error', error)
    return NextResponse.json({ error: 'list_failed' }, { status: 500 })
  }

  // Équipe admin (pour le menu déroulant « acteur ») ∪ acteurs distincts de la page.
  const { data: adminRows } = await sb
    .from('admin_users')
    .select('user_id, created_at')
    .order('created_at', { ascending: true })
  const adminIds = (adminRows ?? []).map((a) => a.user_id)
  const pageActorIds = [
    ...new Set((logRows ?? []).map((r) => r.actor_id).filter((x): x is string => !!x)),
  ]
  const display = await resolveDisplay(sb, [...new Set([...adminIds, ...pageActorIds])])

  const rows = (logRows ?? []).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id,
    summary: r.summary,
    isHighImpact: r.is_high_impact,
    diff: r.diff,
    actor: r.actor_id
      ? { id: r.actor_id, ...(display.get(r.actor_id) ?? { email: null, name: null }) }
      : null,
  }))

  const actors = adminIds.map((id) => ({
    id,
    label: display.get(id)?.name || display.get(id)?.email || id.slice(0, 8),
  }))

  return NextResponse.json({ rows, page, perPage, actors })
}
