import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, reservationCreate, reservationPatch } from '@/lib/schemas'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { recordAuditLog } from '@/lib/audit'

// TTL généreux pour une réservation manuelle (l'admin la gère activement,
// elle ne doit pas s'auto-expirer dès le lendemain comme le flux client 24h).
const MANUAL_RESERVATION_TTL_DAYS = 30

const VALID_STATUSES = [
  'pending',
  'confirmed',
  'collected',
  'expired',
  'cancelled',
] as const
type ReservationStatus = (typeof VALID_STATUSES)[number]

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Configuration serveur manquante' },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // 'all' | un status valide | null
  // scope sépare la boîte de réception (réservations en cours) du journal des
  // ventes (lignes retirées). Source unique partagée par les pages
  // /admin/reservations (inbox) et /admin/ventas (sales).
  const scope = searchParams.get('scope') // 'inbox' | 'sales' | null

  let query = supabaseAdmin
    .from('reservations')
    .select(
      `
        id, status, expires_at, created_at, updated_at,
        confirmed_at, collected_at,
        contact_phone, contact_email, contact_name,
        total_items, total_price, currency,
        admin_notes, source,
        items:reservation_items(
          id, product_id, product_name, unit_price, quantity
        )
      `,
    )
    .order('created_at', { ascending: false })

  if (scope === 'sales') {
    // Journal des ventes = uniquement les lignes retirées (toutes origines).
    query = query.eq('status', 'collected')
  } else if (scope === 'inbox') {
    // Boîte de réception = tout sauf les ventes retirées, avec narrowing
    // optionnel par onglet de statut (pending/confirmed/expired/cancelled).
    query = query.neq('status', 'collected')
    if (
      status &&
      status !== 'all' &&
      status !== 'collected' &&
      VALID_STATUSES.includes(status as ReservationStatus)
    ) {
      query = query.eq('status', status as ReservationStatus)
    }
  } else if (status && status !== 'all' && VALID_STATUSES.includes(status as ReservationStatus)) {
    // Compat héritée : filtre simple par statut sans scope.
    query = query.eq('status', status as ReservationStatus)
  }

  const { data, error } = await query

  if (error) {
    logger.error('[admin/reservations] GET error:', error)
    return apiError('Erreur serveur', error, 500)
  }

  // Petit compteur par status pour les onglets
  const { data: statusCounts } = await supabaseAdmin
    .from('reservations')
    .select('status', { count: 'exact', head: false })

  const counts: Record<string, number> = {
    all: statusCounts?.length ?? 0,
    pending: 0,
    confirmed: 0,
    collected: 0,
    expired: 0,
    cancelled: 0,
  }
  statusCounts?.forEach((r) => {
    if (r.status in counts) counts[r.status]++
  })

  return NextResponse.json({ reservations: data ?? [], counts })
}

/**
 * POST — création manuelle d'une réservation par l'admin.
 * Pour un client walk-in / téléphone sans compte : user_id = NULL (invisible
 * côté compte client, gérée uniquement par l'admin). Status 'pending', TTL 30j.
 * Snapshot des items (product_name + unit_price figés, comme le flux client).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Configuration serveur manquante' },
      { status: 500 },
    )
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const parsed = parseBody(reservationCreate, raw)
  if (!parsed.ok) return parsed.response
  const { contact_name, contact_phone, contact_email, admin_notes, items, sold, user_id, apply_employee_discount } = parsed.data

  const round2 = (n: number) => Math.round(n * 100) / 100

  // Remise employé : applicable UNIQUEMENT à une vente comptoir finalisée
  // (sold). Le taux est lu EN BASE (single-row shop_settings) — jamais transmis
  // ni recalculé par le client (anti-manipulation de prix ; le prix facturé est
  // recomputé serveur et snapshotté sur reservation_items.unit_price).
  let employeeDiscountPct = 0
  if (sold && apply_employee_discount) {
    const { data: cfg, error: cfgError } = await supabaseAdmin
      .from('shop_settings')
      .select('employee_discount_pct')
      .eq('id', 1)
      .single()
    if (cfgError) {
      // Fail-safe : on facture plein tarif plutôt qu'une remise hasardeuse, mais
      // on TRACE la dégradation (RLS/ligne id=1 absente) — sinon invisible.
      logger.warn('[admin/reservations] employee_discount_pct read failed, charging full price', cfgError)
    }
    const rawPct = Number(cfg?.employee_discount_pct ?? 0)
    employeeDiscountPct = Number.isFinite(rawPct) ? Math.min(Math.max(rawPct, 0), 100) : 0
  }
  const applyDiscount = (price: number) =>
    employeeDiscountPct > 0 ? round2(price * (1 - employeeDiscountPct / 100)) : round2(price)

  const pricedItems = items.map((it) => ({ ...it, unit_price: applyDiscount(it.unit_price) }))
  const totalItems = pricedItems.reduce((sum, it) => sum + it.quantity, 0)
  const totalPrice = round2(
    pricedItems.reduce((sum, it) => sum + it.unit_price * it.quantity, 0),
  )

  const nowIso = new Date().toISOString()
  // Vente finalisée (sold) → collected immédiat, pas d'expiration utile
  // (expires_at est NOT NULL → on met now, sans effet car non-pending).
  // Sinon réservation comptoir en attente (TTL classique).
  const expiresAt = sold
    ? nowIso
    : new Date(Date.now() + MANUAL_RESERVATION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: reservation, error: insertError } = await supabaseAdmin
    .from('reservations')
    .insert({
      // Vente comptoir / réservation : liée à un compte client si fourni
      // (historique + avis), sinon anonyme/invité. L'origine reste « counter ».
      user_id: user_id ?? null,
      source: 'counter',
      status: sold ? 'collected' : 'pending',
      collected_at: sold ? nowIso : null,
      expires_at: expiresAt,
      contact_phone: contact_phone?.trim() ? contact_phone.trim() : null,
      contact_email: contact_email?.trim() ? contact_email.trim() : null,
      contact_name: contact_name?.trim() ? contact_name.trim() : null,
      total_items: totalItems,
      total_price: totalPrice,
      currency: DEFAULT_CURRENCY,
      admin_notes: admin_notes?.trim() ? admin_notes.trim() : null,
    })
    .select('id')
    .single()

  if (insertError || !reservation) {
    // Index partiel unique : 1 réservation active par compte client. Survient si
    // on lie une réservation en attente à un client qui en a déjà une active.
    if (insertError?.code === '23505') {
      return NextResponse.json({ error: 'active_reservation_exists' }, { status: 409 })
    }
    return apiError('Erreur lors de la création de la réservation', insertError, 500)
  }

  const { error: itemsError } = await supabaseAdmin
    .from('reservation_items')
    .insert(
      pricedItems.map((it) => ({
        reservation_id: reservation.id,
        product_id: it.product_id ?? null,
        product_name: it.product_name.trim(),
        unit_price: round2(it.unit_price),
        quantity: it.quantity,
      })),
    )

  if (itemsError) {
    // Rollback best-effort : pas de transaction multi-statements via PostgREST,
    // on supprime la réservation orpheline (le cascade nettoie d'éventuels items).
    await supabaseAdmin.from('reservations').delete().eq('id', reservation.id)
    return apiError('Erreur lors de la création des lignes de réservation', itemsError, 500)
  }

  // Vente finalisée : décrémente le stock maintenant que les items existent.
  // RPC idempotente (flag stock_applied). Erreur loggée non bloquante.
  if (sold) {
    const { error: stockErr } = await supabaseAdmin.rpc(
      'apply_reservation_collection',
      { p_reservation_id: reservation.id },
    )
    if (stockErr) logger.error('[admin/reservations] counter sale stock error:', stockErr)
  }

  recordAuditLog({
    actorId: auth.userId,
    action: 'create',
    entity: 'reservation',
    entityId: reservation.id,
    summary: `${sold ? 'Venta mostrador' : 'Reserva creada'}: ${totalItems} art. · ${totalPrice}${employeeDiscountPct > 0 ? ` (−${employeeDiscountPct}% empleado)` : ''}`,
    diff: { sold: !!sold, totalItems, totalPrice, user_id: user_id ?? null, employee_discount_pct: employeeDiscountPct },
  })

  return NextResponse.json({ id: reservation.id }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Configuration serveur manquante' },
      { status: 500 },
    )
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const parsed = parseBody(reservationPatch, raw)
  if (!parsed.ok) return parsed.response
  const { id, status, admin_notes, item_update } = parsed.data

  // P-FLEX volet 1 — ajustement du prix FACTURÉ d'une ligne (tarif
  // préférentiel). RPC atomique : garde statut pending/confirmed + recalcul
  // total_price dans la même transaction. CHANGEMENT SENSIBLE (argent) →
  // audit log high-impact avec diff ancien→nouveau.
  if (item_update) {
    const { data: priceDiff, error: priceErr } = await supabaseAdmin.rpc(
      'set_reservation_item_price',
      {
        p_reservation_id: id,
        p_item_id: item_update.item_id,
        p_unit_price: item_update.unit_price,
      },
    )
    if (priceErr) {
      if (priceErr.message.includes('price_locked')) {
        return NextResponse.json({ error: 'price_locked' }, { status: 409 })
      }
      if (
        priceErr.message.includes('item_not_found') ||
        priceErr.message.includes('reservation_not_found')
      ) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 })
      }
      if (priceErr.message.includes('invalid_price')) {
        return NextResponse.json({ error: 'invalid_price' }, { status: 400 })
      }
      return apiError("Erreur lors de l'ajustement du prix", priceErr, 500)
    }

    const d = priceDiff as {
      product_name: string
      quantity: number
      old_unit_price: number
      new_unit_price: number
      old_total: number
      new_total: number
    }
    recordAuditLog({
      actorId: auth.userId,
      action: 'update',
      entity: 'reservation',
      entityId: id,
      summary: `Precio ajustado: ${d.product_name} ${d.old_unit_price} → ${d.new_unit_price} (total ${d.old_total} → ${d.new_total})`,
      diff: {
        item_id: item_update.item_id,
        product_name: d.product_name,
        quantity: d.quantity,
        unit_price: { old: d.old_unit_price, new: d.new_unit_price },
        total_price: { old: d.old_total, new: d.new_total },
      },
    })
  }

  type ReservationStatusEnum = 'pending' | 'confirmed' | 'collected' | 'expired' | 'cancelled'
  const updateData: {
    status?: ReservationStatusEnum
    confirmed_at?: string
    collected_at?: string
    admin_notes?: string
  } = {}

  if (status) {
    updateData.status = status as ReservationStatusEnum
    if (status === 'confirmed') updateData.confirmed_at = new Date().toISOString()
    if (status === 'collected') updateData.collected_at = new Date().toISOString()
  }

  if (admin_notes !== undefined) {
    updateData.admin_notes = admin_notes
  }

  if (Object.keys(updateData).length === 0) {
    if (!item_update) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }
    // item_update seul : la RPC a déjà tout fait — renvoyer la réservation
    // fraîche (total_price recalculé).
    const { data: fresh, error: freshErr } = await supabaseAdmin
      .from('reservations')
      .select()
      .eq('id', id)
      .single()
    if (freshErr) return apiError('Erreur serveur', freshErr, 500)
    return NextResponse.json({ reservation: fresh })
  }

  // Capture l'ancien statut AVANT l'update pour piloter le stock (décrément à
  // l'entrée en collected, restauration à la sortie de collected).
  let previousStatus: ReservationStatusEnum | null = null
  if (status) {
    const { data: prev } = await supabaseAdmin
      .from('reservations')
      .select('status')
      .eq('id', id)
      .single()
    previousStatus = (prev?.status as ReservationStatusEnum) ?? null
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('[admin/reservations] PATCH error:', error)
    return apiError('Erreur serveur', error, 500)
  }

  // Stock : appliquer/restaurer le décrément selon la transition de statut.
  // Les RPC sont idempotentes (garde stock_applied) → robustes même en cas de
  // ré-appel. Erreur de stock loggée mais non bloquante (le statut a changé).
  if (status && previousStatus !== status) {
    if (status === 'collected') {
      const { error: stockErr } = await supabaseAdmin.rpc(
        'apply_reservation_collection',
        { p_reservation_id: id },
      )
      if (stockErr) logger.error('[admin/reservations] apply stock error:', stockErr)
    } else if (previousStatus === 'collected') {
      const { error: stockErr } = await supabaseAdmin.rpc(
        'restore_reservation_collection',
        { p_reservation_id: id },
      )
      if (stockErr) logger.error('[admin/reservations] restore stock error:', stockErr)
    }
  }

  recordAuditLog({
    actorId: auth.userId,
    action: 'update',
    entity: 'reservation',
    entityId: id,
    summary: status
      ? `Reserva ${id.slice(0, 8)}: ${previousStatus ?? '?'} → ${status}`
      : `Reserva ${id.slice(0, 8)}: notas actualizadas`,
    diff: { ...updateData, previousStatus },
  })

  return NextResponse.json({ reservation: data })
}
