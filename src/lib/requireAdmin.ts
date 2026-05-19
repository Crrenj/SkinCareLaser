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
  // Utilise le client serveur cookie-based (lit la session du browser)
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('requireAdmin session error:', sessionError)
    return {
      ok: false,
      response: NextResponse.json({ error: 'Erreur de session' }, { status: 500 }),
    }
  }

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    }
  }

  // Check admin via la table admin_users (source de vérité, évite la récursion RLS)
  // On utilise le client service-role parce que admin_users a RLS désactivée
  // mais n'est pas accessible en lecture par défaut au rôle anon/authenticated.
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
    .eq('user_id', session.user.id)
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

  return { ok: true, userId: session.user.id }
}
