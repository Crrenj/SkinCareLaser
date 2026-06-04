import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { guardMutation } from '@/lib/csrf'

/**
 * GET /api/wishlist
 *   → Liste les product_id favorisés par l'user connecté.
 *
 * POST /api/wishlist  { product_id: uuid }
 *   → Toggle : ajoute si absent, supprime si présent.
 *     Retourne { added: boolean } pour que le client mette à jour l'UI.
 *
 * RLS bloque tout user non-auth (la table wishlists exige auth.uid()
 * pour SELECT/INSERT/DELETE).
 */

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })

  const { data, error } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('user_id', user.id)

  if (error) {
    logger.error('[/api/wishlist GET]', error)
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })
  }

  return NextResponse.json({
    productIds: (data ?? []).map((row) => row.product_id),
  })
}

export async function POST(request: NextRequest) {
  const guard = guardMutation(request, { json: true })
  if (guard) return guard

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })

  let body: { product_id?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const productId = body.product_id?.trim()
  if (!productId) {
    return NextResponse.json({ error: 'missing_product_id' }, { status: 400 })
  }

  // Existe déjà ? → on delete, sinon on insert
  const { data: existing } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)
    if (error) {
      logger.error('[/api/wishlist DELETE]', error)
      return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
    }
    return NextResponse.json({ added: false })
  }

  const { error } = await supabase
    .from('wishlists')
    .insert({ user_id: user.id, product_id: productId })

  if (error) {
    logger.error('[/api/wishlist INSERT]', error)
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ added: true })
}
