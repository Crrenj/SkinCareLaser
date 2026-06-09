import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, promotionCreate } from '@/lib/schemas'
import { recordAuditLog } from '@/lib/audit'
import { validatePromotionTargets } from './_helpers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/** Résout des libellés lisibles pour les cibles (affichage admin). */
async function resolveTargetLabels(
  sb: SupabaseClient<Database>,
  targets: { target_type: string; target_id: string }[],
): Promise<Map<string, string>> {
  const labels = new Map<string, string>()
  const byType: Record<string, string[]> = { product: [], brand: [], range: [], tag: [] }
  for (const t of targets) byType[t.target_type]?.push(t.target_id)
  const tables: Record<string, 'products' | 'brands' | 'ranges' | 'tags'> = {
    product: 'products', brand: 'brands', range: 'ranges', tag: 'tags',
  }
  await Promise.all(
    Object.entries(byType).map(async ([type, ids]) => {
      const uniq = [...new Set(ids)]
      if (uniq.length === 0) return
      const { data } = await sb.from(tables[type]).select('id, name').in('id', uniq)
      for (const r of data ?? []) labels.set(`${type}:${r.id}`, r.name)
    }),
  )
  return labels
}

// GET — liste des promos avec leurs cibles (libellées).
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }
  const sb = supabaseAdmin

  const { data: promos, error } = await sb
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return apiError('Erreur lors de la récupération des promotions', error, 500)

  const ids = (promos ?? []).map((p) => p.id)
  const { data: targets } = ids.length
    ? await sb.from('promotion_targets').select('id, promotion_id, target_type, target_id').in('promotion_id', ids)
    : { data: [] }

  const labels = await resolveTargetLabels(sb, targets ?? [])
  const targetsByPromo = new Map<string, { target_type: string; target_id: string; label: string }[]>()
  for (const t of targets ?? []) {
    const arr = targetsByPromo.get(t.promotion_id) ?? []
    arr.push({
      target_type: t.target_type,
      target_id: t.target_id,
      label: labels.get(`${t.target_type}:${t.target_id}`) ?? '(supprimé)',
    })
    targetsByPromo.set(t.promotion_id, arr)
  }

  const promotions = (promos ?? []).map((p) => ({ ...p, targets: targetsByPromo.get(p.id) ?? [] }))
  return NextResponse.json({ promotions })
}

// POST — crée une promo + ses cibles (swap atomique via RPC).
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }
  const sb = supabaseAdmin

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  const parsed = parseBody(promotionCreate, raw)
  if (!parsed.ok) return parsed.response
  const { name, discount_type, discount_value, start_date, end_date, is_active, priority, targets } =
    parsed.data

  if (!(await validatePromotionTargets(sb, targets))) {
    return NextResponse.json({ error: 'invalid_target' }, { status: 400 })
  }

  const { data: promo, error } = await sb
    .from('promotions')
    .insert({
      name: name.trim(),
      discount_type,
      discount_value,
      start_date,
      end_date,
      is_active: is_active ?? true,
      priority: priority ?? 0,
      created_by: auth.userId,
    })
    .select('id')
    .single()
  if (error || !promo) return apiError('Erreur lors de la création de la promotion', error, 500)

  const { error: targetsErr } = await sb.rpc('set_promotion_targets', {
    p_promotion_id: promo.id,
    p_targets: targets,
  })
  if (targetsErr) {
    // Rollback best-effort : pas de promo orpheline sans cibles.
    await sb.from('promotions').delete().eq('id', promo.id)
    return apiError('Erreur lors de l\'enregistrement des objectifs', targetsErr, 500)
  }

  recordAuditLog({
    actorId: auth.userId,
    action: 'create',
    entity: 'promotion',
    entityId: promo.id,
    summary: `Promoción creada: ${name.trim()} (${discount_type === 'percent' ? discount_value + '%' : discount_value + ' DOP'})`,
    diff: { name: name.trim(), discount_type, discount_value, start_date, end_date, targets },
  })

  return NextResponse.json({ id: promo.id }, { status: 201 })
}
