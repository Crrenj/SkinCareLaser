import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, getAdminRole } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { z } from 'zod'
import { parseBody } from '@/lib/schemas'
import { recordAuditLog } from '@/lib/audit'

const userAdminPatch = z
  .object({
    isAdmin: z.boolean().optional(),
    role: z.enum(['admin', 'super_admin']).optional(),
  })
  .refine((b) => b.isAdmin !== undefined || b.role !== undefined, {
    message: 'no_field',
  })

/**
 * PATCH /api/admin/users/[id]
 * Body : { isAdmin?: boolean, role?: 'admin' | 'super_admin' }  (au moins un)
 *
 * Gère l'accès admin d'un utilisateur (promote / révoque / change de rôle).
 * **SUPER-ADMIN uniquement** (`requireSuperAdmin`) — garde-fou serveur, pas
 * seulement masquage UI.
 *
 * Garde-fous :
 *   - pas d'auto-modification (anti-lockout)         → 400 cannot_modify_self
 *   - pas de modification d'un AUTRE super_admin      → 400 cannot_modify_super_admin
 *     (anti-coup / anti-orphelinage — retirer un super_admin se fait en DB)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = parseBody(userAdminPatch, raw)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  // Auto-modification interdite (un super-admin ne peut pas se rétrograder /
  // se révoquer lui-même → évite l'orphelinage et le lock-out).
  if (id === auth.userId) {
    return NextResponse.json({ error: 'cannot_modify_self' }, { status: 400 })
  }

  // Protection des pairs : on ne touche jamais un autre super_admin.
  const targetRole = await getAdminRole(id)
  if (targetRole === 'super_admin') {
    return NextResponse.json({ error: 'cannot_modify_super_admin' }, { status: 400 })
  }

  // Révocation de l'accès admin.
  if (body.isAdmin === false) {
    const { error } = await supabaseAdmin.from('admin_users').delete().eq('user_id', id)
    if (error) {
      logger.error('[/api/admin/users/[id]] delete error', error)
      return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
    }
    recordAuditLog({
      actorId: auth.userId,
      action: 'update',
      entity: 'admin_user',
      entityId: id,
      summary: `Acceso admin revocado (${id.slice(0, 8)})`,
      diff: { isAdmin: false },
    })
    return NextResponse.json({ ok: true, isAdmin: false })
  }

  // Promotion (isAdmin:true) ou changement de rôle d'un admin existant.
  // upsert sur user_id : insère si nouveau, met à jour le rôle sinon.
  const nextRole = body.role ?? 'admin'
  const { error } = await supabaseAdmin
    .from('admin_users')
    .upsert({ user_id: id, role: nextRole }, { onConflict: 'user_id' })
  if (error) {
    logger.error('[/api/admin/users/[id]] upsert error', error)
    return NextResponse.json({ error: 'upsert_failed' }, { status: 500 })
  }

  recordAuditLog({
    actorId: auth.userId,
    action: 'update',
    entity: 'admin_user',
    entityId: id,
    summary: `Rol admin asignado: ${nextRole} (${id.slice(0, 8)})`,
    diff: { role: nextRole },
  })

  return NextResponse.json({ ok: true, isAdmin: true, role: nextRole })
}
