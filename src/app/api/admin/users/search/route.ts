import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/admin/users/search?q=
 *
 * Recherche rapide d'un client (pour associer une vente / réservation à un
 * compte). Cherche dans `profiles` (nom / prénom / display_name / téléphone)
 * en ilike. Renvoie au plus 8 résultats légers `{ id, name, phone }`.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  const q = (new URL(request.url).searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ results: [] })

  // Neutralise les caractères qui cassent la syntaxe PostgREST `.or()`.
  const safe = q.replace(/[,()%*]/g, ' ').trim()
  if (!safe) return NextResponse.json({ results: [] })
  const like = `%${safe}%`

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, display_name, phone')
    .or(
      `first_name.ilike.${like},last_name.ilike.${like},display_name.ilike.${like},phone.ilike.${like}`,
    )
    .limit(8)

  if (error) {
    logger.error('[admin/users/search] error:', error)
    return apiError('Erreur serveur', error, 500)
  }

  // Affichage CLIENT : nom + prénom (le pseudo `display_name` est réservé aux
  // admins, cf. src/lib/userName.ts) — fallback pseudo si profil sans nom.
  const results = (data ?? []).map((p) => ({
    id: p.id,
    name:
      [p.last_name, p.first_name].filter(Boolean).join(' ').trim() ||
      p.display_name?.trim() ||
      '—',
    phone: p.phone ?? null,
  }))

  return NextResponse.json({ results })
}
