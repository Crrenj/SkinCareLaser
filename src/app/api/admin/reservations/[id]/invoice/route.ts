import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { recordAuditLog } from '@/lib/audit'
import { getShopSettings } from '@/lib/getShopSettings'
import { buildReservationReference } from '@/lib/reservation'
import { buildInvoiceHtml } from '@/lib/invoiceHtml'

/**
 * GET /api/admin/reservations/[id]/invoice — reçu (comprobante de retiro) d'une
 * vente / réservation RETIRÉE. Document NON FISCAL (FARMAU n'émet pas de NCF).
 *
 * Renvoie un HTML imprimable (text/html) — l'admin imprime / « Enregistre en
 * PDF » depuis le navigateur (zéro dépendance PDF). Calqué sur le pattern de
 * route-fichier de accounting/export.
 *
 * Sécurité : requireAdmin (CSRF + admin_users). Le SELECT est en LISTE BLANCHE
 * (id, product_name, unit_price, quantity) — JAMAIS unit_cost/cost_price
 * (service-role bypasse le column-grant → l'omission est à la charge du SELECT).
 * Le reçu n'existe qu'après la bonne réception : refus si status !== collected.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const { id } = await params
  const lang = new URL(request.url).searchParams.get('lang')

  const { data: reservation, error } = await supabaseAdmin
    .from('reservations')
    .select(
      `
        id, status, created_at, collected_at,
        contact_name, contact_phone, contact_email,
        total_price, currency,
        items:reservation_items(product_name, unit_price, quantity)
      `,
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }
    return apiError('Erreur lors de la génération du reçu', error, 500)
  }

  // Le reçu n'a de sens qu'après la collecte (bonne réception confirmée).
  if (reservation.status !== 'collected') {
    return NextResponse.json({ error: 'not_collected' }, { status: 409 })
  }

  const shop = await getShopSettings()
  const reference = buildReservationReference(reservation.id, reservation.created_at)

  const html = buildInvoiceHtml({
    reference,
    date: reservation.collected_at ?? reservation.created_at,
    locale: lang,
    customerName: reservation.contact_name,
    customerPhone: reservation.contact_phone,
    customerEmail: reservation.contact_email,
    items: (reservation.items ?? []).map((it) => ({
      name: it.product_name,
      unitPrice: it.unit_price,
      quantity: it.quantity,
    })),
    total: reservation.total_price,
    currency: reservation.currency || 'DOP',
    vendor: {
      name: shop.shop_name,
      tagline: shop.shop_tagline,
      address: shop.pickup_address,
      hours: shop.pickup_hours,
      phone: shop.pickup_phone ?? shop.contact_phone,
      email: shop.contact_email,
    },
  })

  recordAuditLog({
    actorId: auth.userId,
    action: 'create',
    entity: 'invoice',
    entityId: reservation.id,
    summary: `Recibo generado: ${reference} · ${reservation.total_price}`,
  })

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      // Document client (PII) derrière auth — jamais indexable.
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
