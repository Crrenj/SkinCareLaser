import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { guardMutation } from '@/lib/csrf'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { reviewCreate } from '@/lib/schemas'

/**
 * POST /api/reviews  { product_id, rating, title?, body? }
 *
 * Crée/met à jour l'avis de l'utilisateur connecté pour un produit.
 *  - Auth requise (401 sinon) + garde CSRF + rate limit (5 / 10 min / IP).
 *  - `status` est forcé à 'pending' (modération admin), `verified_purchase` et
 *    `author_name` sont calculés côté serveur — le client ne peut pas les poser
 *    (le body Zod ne les accepte pas → anti mass-assignment).
 *  - Écriture en service-role : la table `reviews` n'a volontairement pas de
 *    policy INSERT, l'écriture est entièrement contrôlée ici.
 *  - Un seul avis par (user, produit) → upsert sur la contrainte unique.
 */
export async function POST(request: NextRequest) {
  const guard = guardMutation(request, { json: true })
  if (guard) return guard

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'server_misconfig' }, { status: 500 })
  }

  const ip = getClientIp(request)
  const rl = await checkRateLimit(`reviews:${ip}`, 5, 600)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfter: rl.retryAfter },
      { status: 429 },
    )
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = reviewCreate.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { product_id, rating, title, body } = parsed.data

  // verified_purchase : l'utilisateur a-t-il une réservation « collected »
  // contenant ce produit ?
  const { data: collected } = await supabaseAdmin
    .from('reservations')
    .select('id, reservation_items!inner(product_id)')
    .eq('user_id', user.id)
    .eq('status', 'collected')
    .eq('reservation_items.product_id', product_id)
    .limit(1)
  const verifiedPurchase = Array.isArray(collected) && collected.length > 0

  // author_name : snapshot depuis le profil (pas de jointure auth.users côté lecture).
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('display_name, first_name')
    .eq('id', user.id)
    .maybeSingle()
  const authorName =
    profile?.display_name?.trim() || profile?.first_name?.trim() || null

  const { error } = await supabaseAdmin.from('reviews').upsert(
    {
      product_id,
      user_id: user.id,
      rating,
      title: title ?? null,
      body: body ?? null,
      author_name: authorName,
      verified_purchase: verifiedPurchase,
      status: 'pending',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,product_id' },
  )

  if (error) {
    logger.error('[/api/reviews POST]', error)
    return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: 'pending', verified_purchase: verifiedPurchase })
}
