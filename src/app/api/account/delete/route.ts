import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { guardMutation } from '@/lib/csrf'
import { parseBody, accountDeleteBody } from '@/lib/schemas'
import { recordAuditLog } from '@/lib/audit'
import { apiError } from '@/lib/apiError'
import { logger } from '@/lib/logger'

/**
 * POST /api/account/delete — effacement réel du compte (droit à l'oubli,
 * Ley 172-13 RD ; les CGV promettent « effectif sous 30 jours », ici c'est
 * immédiat). Remplace l'ancien mailto manuel.
 *
 * Auth requise (getUser valide le JWT côté serveur). Body Zod
 * { confirm: 'ELIMINAR' } → confirmation explicite.
 *
 * Garde-fous métier (modèle « un compte, deux casquettes ») :
 *  - Un ADMIN ne peut PAS s'auto-supprimer (présence dans admin_users → 403).
 *    Il doit d'abord être révoqué par un super-admin (anti-orphelinage : son
 *    départ doit passer par la gestion d'équipe, jamais par cet endpoint).
 *
 * Ordre des opérations (l'inverse perdrait des données) :
 *  1. Détacher reservations.user_id (la FK est ON DELETE **CASCADE** → laisser
 *     deleteUser cascader DÉTRUIRAIT tout l'historique de réservations/ventes
 *     du client, donc la compta lue par /admin/ventas). On met user_id à NULL
 *     d'abord (colonne nullable) pour préserver les lignes.
 *  2. Anonymiser les coordonnées de contact de ces réservations (nom/tél/email
 *     → NULL) : les montants/items restent, la compta lit unit_price.
 *  3. Supprimer le compte auth → cascade NETTOYE le reste (profiles, carts +
 *     cart_items, wishlists, reviews — tous ON DELETE CASCADE = données
 *     personnelles, donc OK). audit_log.actor_id / expenses.created_by / etc.
 *     sont ON DELETE SET NULL → l'historique reste, l'acteur devient « Système ».
 */
export async function POST(request: NextRequest) {
  const guard = guardMutation(request, { json: true })
  if (guard) return guard

  if (!supabaseAdmin) {
    return apiError('Configuration serveur manquante', undefined, 500)
  }
  const admin = supabaseAdmin

  // Auth — getUser() valide le JWT côté serveur Supabase.
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const userId = user.id

  // Validation du body (confirmation explicite).
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = parseBody(accountDeleteBody, raw)
  if (!parsed.ok) return parsed.response

  // Anti-orphelinage : un admin ne peut pas s'auto-supprimer via cet endpoint.
  // Source de vérité = table admin_users (service-role, bypass RLS).
  const { data: adminRow, error: adminLookupError } = await admin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (adminLookupError) {
    return apiError('Erreur serveur', adminLookupError, 500)
  }
  if (adminRow) {
    // 403 explicite : un admin doit d'abord être révoqué (gestion d'équipe).
    return NextResponse.json({ error: 'admin_must_be_revoked' }, { status: 403 })
  }

  // 1) + 2) Détacher + anonymiser les réservations AVANT la suppression auth
  // (la FK est ON DELETE CASCADE → on ne peut pas se reposer sur la cascade).
  const { error: detachError } = await admin
    .from('reservations')
    .update({
      user_id: null,
      contact_name: null,
      contact_phone: null,
      contact_email: null,
    })
    .eq('user_id', userId)
  if (detachError) {
    return apiError('Échec de l’anonymisation', detachError, 500)
  }

  // 3) Suppression du compte auth → cascade le reste des données personnelles.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) {
    // Cas dégradé possible : réservations déjà détachées/anonymisées mais le
    // compte subsiste. On le logge (le client peut réessayer).
    logger.error('[account/delete] deleteUser a échoué', deleteError)
    return apiError('Échec de la suppression du compte', deleteError, 500)
  }

  // Audit : action sensible, SANS PII dans le diff (jamais l'email du client).
  recordAuditLog({
    actorId: userId,
    action: 'delete',
    entity: 'user',
    entityId: userId,
    summary: 'El cliente eliminó su propia cuenta (derecho al olvido).',
    diff: { reservations_anonymized: true, self_service: true },
  })

  // Le client gère le signOut + redirect home après cette réponse.
  return NextResponse.json({ ok: true })
}
