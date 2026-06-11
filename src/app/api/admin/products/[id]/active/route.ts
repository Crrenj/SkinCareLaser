import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, productActiveBody } from '@/lib/schemas'
import { recordAuditLog } from '@/lib/audit'

/**
 * PATCH /api/admin/products/[id]/active — activation/désactivation EXPLICITE
 * d'un produit (barrière d'initialisation L-3 du lancement : un produit reste
 * caché tant qu'il n'a pas prix réel + stock réel, puis l'admin l'active ici).
 *
 * Route dédiée VOLONTAIREMENT séparée du PATCH produit générique :
 * `productUpdate` strippe `is_active` (invariant anti-mass-assignment testé
 * par schemas.test.ts) — basculer la visibilité est une action délibérée,
 * tracée en audit (product:update = high-impact).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const { id } = await params

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const parsed = parseBody(productActiveBody, raw)
  if (!parsed.ok) return parsed.response
  const { is_active } = parsed.data

  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name, is_active')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
    }
    return apiError("Erreur lors du changement d'activation", error, 500)
  }

  recordAuditLog({
    actorId: auth.userId,
    action: 'update',
    entity: 'product',
    entityId: id,
    summary: `Producto ${is_active ? 'activado' : 'desactivado'}: ${data.name}`,
    diff: { is_active },
  })

  return NextResponse.json({ product: data })
}
