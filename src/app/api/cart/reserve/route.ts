import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { guardMutation } from '@/lib/csrf'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { parseBody, guestReservationBody } from '@/lib/schemas'

/**
 * POST /api/cart/reserve
 *
 * Convertit le panier courant en réservation pending (TTL 24h).
 *  - User connecté → RPC `create_reservation` (auth.uid()), snapshot profil.
 *  - Invité (sans compte) → RPC `create_guest_reservation` : panier résolu via
 *    le cookie httpOnly `cart_id` (anti-IDOR : jamais d'id passé par le client),
 *    coordonnées (nom+tél) fournies dans le body, rate-limit anti-spam, et un
 *    confirmation_token non-devinable renvoyé pour l'accès à la confirmation.
 *
 * Succès : 200 { success: true, reservationId, confirmationToken? }
 */
export async function POST(request: NextRequest) {
  const guard = guardMutation(request, { json: false })
  if (guard) return guard

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ─────────────────────────── Invité (sans compte) ───────────────────────────
  if (!user) {
    return reserveAsGuest(request)
  }

  // ─────────────────────── User connecté (flux inchangé) ───────────────────────
  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (cartError) {
    logger.error('[reserve] cart lookup error:', cartError)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', code: 'cart_lookup_error' },
      { status: 500 },
    )
  }

  if (!cart) {
    return NextResponse.json(
      { success: false, error: 'Votre panier est vide', code: 'cart_empty' },
      { status: 400 },
    )
  }

  const { data: reservationId, error: rpcError } = await supabase.rpc(
    'create_reservation',
    { p_cart_id: cart.id },
  )

  if (rpcError) {
    switch (rpcError.code) {
      case '42501':
        return NextResponse.json(
          { success: false, error: 'Authentification requise', code: 'auth_required' },
          { status: 401 },
        )
      case 'P0001':
        return NextResponse.json(
          { success: false, error: 'Vous avez déjà une réservation active', code: 'already_active' },
          { status: 409 },
        )
      case 'P0002':
        return NextResponse.json(
          { success: false, error: 'Téléphone requis sur votre profil pour réserver', code: 'phone_required' },
          { status: 400 },
        )
      case 'P0003':
        return NextResponse.json(
          { success: false, error: 'Email manquant sur le compte', code: 'email_missing' },
          { status: 500 },
        )
      case 'P0004':
        return NextResponse.json(
          { success: false, error: 'Panier introuvable', code: 'cart_not_found' },
          { status: 404 },
        )
      case 'P0005':
        return NextResponse.json(
          { success: false, error: 'Votre panier est vide', code: 'cart_empty' },
          { status: 400 },
        )
      default:
        logger.error('[reserve] RPC error:', rpcError)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la réservation', code: 'rpc_error' },
          { status: 500 },
        )
    }
  }

  return NextResponse.json({ success: true, reservationId })
}

/**
 * Branche invité : panier résolu par le cookie httpOnly `cart_id` (= anonymous_id),
 * validé côté DB par la RPC (ownership anonymous_id). Service-role.
 */
async function reserveAsGuest(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: 'Configuration serveur manquante', code: 'server_config' },
      { status: 500 },
    )
  }

  const cookieStore = await cookies()
  const anonId = cookieStore.get('cart_id')?.value ?? null
  if (!anonId) {
    return NextResponse.json(
      { success: false, error: 'Votre panier est vide', code: 'cart_empty' },
      { status: 400 },
    )
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body JSON invalide', code: 'bad_body' },
      { status: 400 },
    )
  }

  const parsed = parseBody(guestReservationBody, raw)
  if (!parsed.ok) return parsed.response
  const { contact_name, contact_phone, contact_email } = parsed.data

  // Anti-spam : endpoint public. Bucket par IP (non-spoofable) + par téléphone
  // normalisé (contre la rotation d'IP). On garde le Retry-After le plus long.
  const ip = getClientIp(request)
  const phoneKey = contact_phone.replace(/[^0-9]/g, '')
  const [byIp, byPhone] = await Promise.all([
    checkRateLimit(`guest-reserve:ip:${ip}`, 5, 600),
    checkRateLimit(`guest-reserve:phone:${phoneKey}`, 3, 3600),
  ])
  if (!byIp.allowed || !byPhone.allowed) {
    const retryAfter = Math.max(byIp.retryAfter, byPhone.retryAfter)
    return NextResponse.json(
      { success: false, error: 'Trop de tentatives, réessayez plus tard', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  // Résout le cart de l'invité depuis l'anonymous_id du cookie (jamais du body).
  const { data: cartId, error: cartErr } = await supabaseAdmin.rpc('get_or_create_cart', {
    p_anonymous_id: anonId,
  })
  if (cartErr || !cartId) {
    logger.error('[reserve guest] cart resolve error:', cartErr)
    return NextResponse.json(
      { success: false, error: 'Panier introuvable', code: 'cart_not_found' },
      { status: 404 },
    )
  }

  const { data, error } = await supabaseAdmin.rpc('create_guest_reservation', {
    p_cart_id: cartId,
    p_anon_id: anonId,
    p_name: contact_name ?? '',
    p_phone: contact_phone,
    p_email: contact_email || undefined,
  })

  if (error) {
    switch (error.code) {
      case 'P0002':
        return NextResponse.json(
          { success: false, error: 'Téléphone requis pour réserver', code: 'phone_required' },
          { status: 400 },
        )
      case 'P0004':
        return NextResponse.json(
          { success: false, error: 'Panier introuvable', code: 'cart_not_found' },
          { status: 404 },
        )
      case 'P0005':
        return NextResponse.json(
          { success: false, error: 'Votre panier est vide', code: 'cart_empty' },
          { status: 400 },
        )
      default:
        logger.error('[reserve guest] RPC error:', error)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la réservation', code: 'rpc_error' },
          { status: 500 },
        )
    }
  }

  const row = Array.isArray(data) ? data[0] : data
  return NextResponse.json({
    success: true,
    reservationId: row?.id,
    confirmationToken: row?.confirmation_token,
  })
}
