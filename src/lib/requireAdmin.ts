import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from './supabaseServer'
import { supabaseAdmin } from './supabaseAdmin'

export type AdminGuardResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }

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
  const supabase = await createSupabaseServerClient()

  // getUser() valide le JWT côté serveur Supabase (vs getSession() qui se
  // contente du cookie local). Coût ~50-200ms, OK pour les routes admin.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && userError.name !== 'AuthSessionMissingError') {
    console.error('requireAdmin getUser error:', userError.message)
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
    console.error('requireAdmin admin lookup error:', adminError)
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
