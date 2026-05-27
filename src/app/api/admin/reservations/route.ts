import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, reservationPatch } from '@/lib/schemas'

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

  let query = supabaseAdmin
    .from('reservations')
    .select(
      `
        id, status, expires_at, created_at, updated_at,
        confirmed_at, collected_at,
        contact_phone, contact_email, contact_name,
        total_items, total_price, currency,
        admin_notes,
        items:reservation_items(
          id, product_id, product_name, unit_price, quantity
        )
      `,
    )
    .order('created_at', { ascending: false })

  if (status && status !== 'all' && VALID_STATUSES.includes(status as ReservationStatus)) {
    query = query.eq('status', status as ReservationStatus)
  }

  const { data, error } = await query

  if (error) {
    logger.error('[admin/reservations] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
  const { id, status, admin_notes } = parsed.data

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
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('[admin/reservations] PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reservation: data })
}
