import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, stockEntryBody } from '@/lib/schemas'

/**
 * POST — enregistre une entrée de stock (réception fournisseur).
 *
 * Incrémente products.stock ET recalcule le coût moyen pondéré
 * (products.cost_price) via la RPC `record_stock_entries` (atomique,
 * idempotente par `client_token`). Le coût n'est JAMAIS écrit ailleurs.
 * created_by = admin courant (jamais fourni par le client). Les champs
 * fiscaux 606 vides sont normalisés en NULL.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const parsed = parseBody(stockEntryBody, raw)
  if (!parsed.ok) return parsed.response
  const { client_token, supplier_name, supplier_rnc, ncf, invoice_date, items, note } = parsed.data

  const clean = (s: string | undefined) => (s && s.trim() ? s.trim() : null)

  const { error } = await supabaseAdmin.rpc('record_stock_entries', {
    p_items: items,
    p_supplier_name: clean(supplier_name),
    p_supplier_rnc: clean(supplier_rnc),
    p_ncf: clean(ncf),
    p_invoice_date: invoice_date ?? null,
    p_note: clean(note),
    p_created_by: auth.userId,
    p_client_token: client_token,
  })

  if (error) {
    logger.error('[admin/stock/entry] RPC error:', error)
    return apiError("Erreur lors de l'enregistrement de l'entrée de stock", error, 500)
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
