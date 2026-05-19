import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

/**
 * POST /api/cart/reserve
 *
 * Convertit le panier de l'utilisateur connecté en une réservation
 * pending (TTL 24h) via la RPC `create_reservation`.
 *
 * Préconditions :
 *  - User connecté (sinon 401)
 *  - Profil avec téléphone (sinon 400 + code `phone_required`)
 *  - Cart non vide (sinon 400 + code `cart_empty`)
 *  - Pas déjà une réservation active (sinon 409 + code `already_active`)
 *
 * Succès : 200 { success: true, reservationId }
 */
export async function POST() {
  const supabase = await createSupabaseServerClient()

  // 1. Vérifie l'auth via cookie session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('[reserve] session error:', sessionError)
    return NextResponse.json(
      { success: false, error: 'Erreur de session', code: 'session_error' },
      { status: 500 },
    )
  }

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: 'Vous devez être connecté pour réserver',
        code: 'auth_required',
      },
      { status: 401 },
    )
  }

  // 2. Récupère le cart_id du user (la RPC le revérifie côté DB)
  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (cartError) {
    console.error('[reserve] cart lookup error:', cartError)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', code: 'cart_lookup_error' },
      { status: 500 },
    )
  }

  if (!cart) {
    return NextResponse.json(
      {
        success: false,
        error: 'Votre panier est vide',
        code: 'cart_empty',
      },
      { status: 400 },
    )
  }

  // 3. Appel RPC : auth.uid() côté DB lit la session JWT
  const { data: reservationId, error: rpcError } = await supabase.rpc(
    'create_reservation',
    { p_cart_id: cart.id },
  )

  if (rpcError) {
    // Map les ERRCODE de la RPC vers HTTP + un `code` machine-readable
    // pour que le client puisse rediriger (ex: phone_required -> /account/profile)
    switch (rpcError.code) {
      case '42501':
        return NextResponse.json(
          {
            success: false,
            error: 'Authentification requise',
            code: 'auth_required',
          },
          { status: 401 },
        )
      case 'P0001':
        return NextResponse.json(
          {
            success: false,
            error: 'Vous avez déjà une réservation active',
            code: 'already_active',
          },
          { status: 409 },
        )
      case 'P0002':
        return NextResponse.json(
          {
            success: false,
            error: 'Téléphone requis sur votre profil pour réserver',
            code: 'phone_required',
          },
          { status: 400 },
        )
      case 'P0003':
        return NextResponse.json(
          {
            success: false,
            error: 'Email manquant sur le compte',
            code: 'email_missing',
          },
          { status: 500 },
        )
      case 'P0004':
        return NextResponse.json(
          {
            success: false,
            error: 'Panier introuvable',
            code: 'cart_not_found',
          },
          { status: 404 },
        )
      case 'P0005':
        return NextResponse.json(
          {
            success: false,
            error: 'Votre panier est vide',
            code: 'cart_empty',
          },
          { status: 400 },
        )
      default:
        console.error('[reserve] RPC error:', rpcError)
        return NextResponse.json(
          {
            success: false,
            error: 'Erreur lors de la réservation',
            code: 'rpc_error',
          },
          { status: 500 },
        )
    }
  }

  return NextResponse.json({ success: true, reservationId })
}
