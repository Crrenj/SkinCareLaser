import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { guardMutation } from '@/lib/csrf'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { parseBody, guestReservationBody } from '@/lib/schemas'
import {
  sendReservationConfirmationEmail,
  type ReservationEmailItem,
} from '@/lib/reservationEmail'

/**
 * Charge le snapshot d'une réservation (contact + items + total + created_at)
 * et envoie l'email de confirmation, NON-BLOQUANT (via `after()`). Best-effort
 * absolu : tout est try/catch + logger.error — un échec ici ne peut jamais
 * faire échouer la réponse de réservation. No-op si pas de service-role, pas
 * d'email destinataire, ou pas de RESEND_API_KEY (cf. reservationEmail).
 *
 * @param fallbackEmail email à utiliser si la colonne contact_email est vide
 *   (chemin compte : email de la session auth).
 * @param locale       locale déjà résolue (profil > body > 'fr').
 */
function scheduleReservationEmail(params: {
  reservationId: string
  fallbackEmail?: string | null
  locale?: string | null
}): void {
  const sb = supabaseAdmin
  if (!sb) return
  after(async () => {
    try {
      const { data: reservation, error: resErr } = await sb
        .from('reservations')
        .select('contact_email, contact_name, contact_phone, total_price, created_at')
        .eq('id', params.reservationId)
        .maybeSingle()
      if (resErr || !reservation) {
        if (resErr) logger.error('[reserve email] reservation lookup error:', resErr)
        return
      }

      const to = (reservation.contact_email || params.fallbackEmail || '').trim()
      if (!to) return // Réservation sans email (ex. invité sans email fourni) → pas d'envoi.

      const { data: items, error: itemsErr } = await sb
        .from('reservation_items')
        .select('product_name, unit_price, quantity')
        .eq('reservation_id', params.reservationId)
      if (itemsErr) {
        logger.error('[reserve email] items lookup error:', itemsErr)
        return
      }

      const emailItems: ReservationEmailItem[] = (items ?? []).map((it) => ({
        name: it.product_name,
        unitPrice: Number(it.unit_price),
        quantity: it.quantity,
      }))
      if (emailItems.length === 0) return

      await sendReservationConfirmationEmail({
        to,
        reservationId: params.reservationId,
        createdAt: reservation.created_at,
        locale: params.locale,
        contactName: reservation.contact_name,
        contactPhone: reservation.contact_phone,
        items: emailItems,
        total: Number(reservation.total_price),
      })
    } catch (e) {
      logger.error('[reserve email] unexpected error:', e)
    }
  })
}

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

  // Locale d'envoi de l'email : on lit le `preferred_locale` du profil ; si
  // absent, on retombe sur la locale éventuellement passée dans le body (le
  // client peut l'envoyer sans changer le contrat), puis 'fr'. Body lu de façon
  // tolérante : le chemin compte n'exige aucun body.
  let bodyLocale: string | null = null
  try {
    const raw = (await request.json()) as { locale?: unknown }
    if (typeof raw?.locale === 'string') bodyLocale = raw.locale
  } catch {
    // Pas de body / JSON invalide : ignoré (le chemin compte n'en a pas besoin).
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

  // Email de confirmation (trace durable) — non-bloquant. Locale = preferred_locale
  // du profil > locale du body > 'fr'. fallbackEmail = email de la session auth
  // (la résa snapshote déjà l'email, mais on garde un filet).
  if (typeof reservationId === 'string') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_locale')
      .eq('id', user.id)
      .maybeSingle()
    scheduleReservationEmail({
      reservationId,
      fallbackEmail: user.email ?? null,
      locale: profile?.preferred_locale ?? bodyLocale,
    })
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
  // failClosed (G-5) : création de réservation invité (ligne DB + email) sans
  // compte — rate-limiter en panne → refus, pas d'ouverture du robinet.
  const [byIp, byPhone] = await Promise.all([
    checkRateLimit(`guest-reserve:ip:${ip}`, 5, 600, { failClosed: true }),
    checkRateLimit(`guest-reserve:phone:${phoneKey}`, 3, 3600, { failClosed: true }),
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

  // Email de confirmation (trace durable) — uniquement si l'invité a fourni un
  // email. Non-bloquant. Locale = celle passée dans le body (optionnelle) > 'fr'.
  if (row?.id && contact_email) {
    const rawBody = raw as { locale?: unknown }
    const bodyLocale = typeof rawBody?.locale === 'string' ? rawBody.locale : null
    scheduleReservationEmail({
      reservationId: row.id,
      fallbackEmail: contact_email,
      locale: bodyLocale,
    })
  }

  return NextResponse.json({
    success: true,
    reservationId: row?.id,
    confirmationToken: row?.confirmation_token,
  })
}
