import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createSupabaseServerClient } from './supabaseServer'
import { supabaseAdmin } from './supabaseAdmin'
import { assertOriginFromHeaders } from './csrf'

export type AdminGuardResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }

export type AdminRole = 'admin' | 'super_admin'

/**
 * Vérifie que la requête est authentifiée ET que l'utilisateur est admin.
 *
 * Usage dans une route handler :
 *
 *   const auth = await requireAdmin()
 *   if (!auth.ok) return auth.response
 *   // ... auth.userId disponible
 *
 * Retours :
 *   - 401 si pas de session (cookies absents ou invalides)
 *   - 403 si session valide mais user pas dans `admin_users`
 *   - 500 si configuration Supabase manquante côté serveur
 */
export async function requireAdmin(): Promise<AdminGuardResult> {
  // Garde CSRF centralisée pour toutes les routes /api/admin/* : rejette les
  // requêtes cross-origin (les requêtes same-origin et sans Origin passent),
  // y compris sur les GET — l'API admin n'a aucune raison d'être cross-origin.
  const originError = assertOriginFromHeaders(await headers())
  if (originError) return { ok: false, response: originError }

  const supabase = await createSupabaseServerClient()

  // getUser() valide le JWT côté serveur Supabase (vs getSession() qui se
  // contente du cookie local). Coût ~50-200ms, OK pour les routes admin.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && userError.name !== 'AuthSessionMissingError') {
    logger.error('requireAdmin getUser error:', userError.message)
  }

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    }
  }

  // Source de vérité admin : table admin_users via le service-role (bypass
  // RLS, pas de policy SELECT publique). Le middleware utilise plutôt la RPC
  // is_user_admin qui est SECURITY DEFINER — ici on a déjà supabaseAdmin
  // sous la main donc on l'utilise directement.
  if (!supabaseAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 },
      ),
    }
  }

  const { data: admin, error: adminError } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (adminError) {
    logger.error('requireAdmin admin lookup error:', adminError)
    return {
      ok: false,
      response: NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }),
    }
  }

  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Accès admin requis' }, { status: 403 }),
    }
  }

  return { ok: true, userId: user.id }
}

/**
 * Lit le rôle admin d'un utilisateur (null s'il n'est pas admin).
 * Service-role (bypass RLS). Utilisé pour enrichir les listes admin et
 * piloter le gating super-admin.
 */
export async function getAdminRole(userId: string): Promise<AdminRole | null> {
  if (!supabaseAdmin) return null
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    logger.error('getAdminRole lookup error:', error)
    return null
  }
  if (!data) return null
  return data.role === 'super_admin' ? 'super_admin' : 'admin'
}

/**
 * Comme {@link requireAdmin} mais exige le rôle `super_admin` (gestion de
 * l'équipe admin : promouvoir/rétrograder/changer de rôle). Garde-fou serveur
 * — ne jamais se fier au seul masquage UI.
 *
 *   - 401 si pas de session
 *   - 403 { error: 'super_admin_required' } si admin simple ou non-admin
 */
export async function requireSuperAdmin(): Promise<AdminGuardResult> {
  const originError = assertOriginFromHeaders(await headers())
  if (originError) return { ok: false, response: originError }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && userError.name !== 'AuthSessionMissingError') {
    logger.error('requireSuperAdmin getUser error:', userError.message)
  }

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    }
  }

  if (!supabaseAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 },
      ),
    }
  }

  const role = await getAdminRole(user.id)
  if (role !== 'super_admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'super_admin_required' }, { status: 403 }),
    }
  }

  return { ok: true, userId: user.id }
}
