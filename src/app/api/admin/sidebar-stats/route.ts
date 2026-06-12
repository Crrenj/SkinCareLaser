import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getShopSettings } from '@/lib/getShopSettings'

/**
 * GET /api/admin/sidebar-stats
 *
 * Retourne les compteurs affichés en badges dans la sidebar admin :
 *   - products  : total produits actifs
 *   - low_stock : produits actifs nécessitant attention — stock ≤ seuil
 *     configuré (shop_settings.low_stock_threshold), rupture (0) incluse
 *   - reservations : réservations en attente d'action (pending|confirmed)
 *   - messages  : tickets de support ouverts (status = open)
 *
 * Cache HTTP 15 s pour limiter les hits si la sidebar reste ouverte.
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  const { low_stock_threshold: threshold } = await getShopSettings()

  const [products, lowStock, reservations, messages] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('stock', threshold),
    supabaseAdmin
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed']),
    supabaseAdmin
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open'),
  ])

  return NextResponse.json(
    {
      products: products.count ?? 0,
      low_stock: lowStock.count ?? 0,
      reservations: reservations.count ?? 0,
      messages: messages.count ?? 0,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=15, must-revalidate',
      },
    },
  )
}
