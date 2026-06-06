import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/admin/reviews?status=pending|approved|rejected
 *   → liste des avis pour la modération (requireAdmin, service-role).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'server_misconfig' }, { status: 500 })
  }

  const status = request.nextUrl.searchParams.get('status')?.trim()

  let query = supabaseAdmin
    .from('reviews')
    .select(
      'id, product_id, user_id, rating, title, body, author_name, status, verified_purchase, created_at, product:products!reviews_product_id_fkey(name, slug)',
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) {
    logger.error('[/api/admin/reviews GET]', error)
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })
  }

  return NextResponse.json({ reviews: data ?? [] })
}
