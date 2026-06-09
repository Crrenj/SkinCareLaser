import 'server-only'
import { after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { logger } from '@/lib/logger'
import type { Json } from '@/lib/database.types'

/**
 * Journal d'audit admin — qui a fait quelle mutation (transparence d'équipe).
 *
 * Appelé depuis les routes /api/admin/* (service-role → bypass RLS pour l'écriture).
 * Écriture via `after()` (next/server) : exécutée APRÈS l'envoi de la réponse, en
 * gardant l'instance serverless vivante (Vercel) → zéro latence ajoutée ET aucune
 * perte de log (un `void (async)()` nu serait gelé/abandonné après la réponse).
 * Best-effort absolu : ne throw jamais, no-op si service-role absent. Un échec
 * d'insert ne peut donc pas casser la mutation métier.
 */

export type AuditAction = 'create' | 'update' | 'delete'

export type AuditEntity =
  | 'product'
  | 'reservation'
  | 'expense'
  | 'stock'
  | 'merma'
  | 'promotion'
  | 'admin_user'
  | 'user'
  | 'setting'
  | 'appearance'
  | 'home_layout'
  | 'banner'
  | 'post'
  | 'review'
  | 'message'
  | 'tag'
  | 'tag_type'
  | 'brand'
  | 'range'
  | 'newsletter'
  | 'upload'

// (entity:action) considérés à fort impact → alimente le filtre « Solo alto impacto »
// et la colonne stockée `is_high_impact`. Typé en template-literal : un typo de clé
// casse `tsc`. Curation volontaire (argent / stock / accès / config / catalogue prix).
const HIGH_IMPACT = new Set<`${AuditEntity}:${AuditAction}`>([
  'reservation:create',
  'reservation:update',
  'stock:update',
  'stock:create',
  'merma:create',
  'expense:create',
  'expense:delete',
  'product:create',
  'product:update',
  'product:delete',
  'promotion:create',
  'promotion:update',
  'promotion:delete',
  'admin_user:update',
  'user:create',
  'setting:update',
  'appearance:update',
  'home_layout:update',
])

// Clés jamais persistées dans `diff` : blobs base64 (≤ ~5 Mo → bloat + rendu) et secrets.
const SENSITIVE_KEYS = new Set(['file', 'imageFile', 'password'])
const MAX_DIFF_STRING = 2000

/** Retire les clés sensibles et tronque les chaînes trop longues (defense-in-depth). */
function sanitizeDiff(diff?: Json | null): Json | null {
  if (!diff || typeof diff !== 'object' || Array.isArray(diff)) return diff ?? null
  const out: Record<string, Json> = {}
  for (const [k, v] of Object.entries(diff as Record<string, Json>)) {
    if (SENSITIVE_KEYS.has(k)) continue
    out[k] =
      typeof v === 'string' && v.length > MAX_DIFF_STRING
        ? `${v.slice(0, MAX_DIFF_STRING)}…`
        : v
  }
  return out
}

export function recordAuditLog(params: {
  actorId: string | null
  action: AuditAction
  entity: AuditEntity
  entityId?: string | null
  summary?: string | null
  diff?: Json | null
}): void {
  if (!supabaseAdmin) return
  const sb = supabaseAdmin
  after(async () => {
    try {
      const { error } = await sb.from('audit_log').insert({
        actor_id: params.actorId,
        action: params.action,
        entity: params.entity,
        entity_id: params.entityId ?? null,
        summary: params.summary ?? null,
        diff: sanitizeDiff(params.diff),
        is_high_impact: HIGH_IMPACT.has(`${params.entity}:${params.action}`),
      })
      if (error) logger.error('[audit] insert error', error)
    } catch (e) {
      logger.error('[audit] unexpected error', e)
    }
  })
}
