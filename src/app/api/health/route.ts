import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

/**
 * Seuil de staleness du cron expire-stale-reservations : cadence de 15 min
 * (migration 20260610190000) → 2 exécutions manquées + marge = alerte.
 */
const CRON_STALE_MS = 35 * 60 * 1000

/**
 * GET /api/health — endpoint de supervision (G-4a).
 *
 * À brancher sur un uptime monitor externe (UptimeRobot, Better Stack…) :
 * 200 = sain ; 503 = le cron pg_cron n'a pas tourné depuis > 35 min (il
 * échouait jusqu'ici EN SILENCE → réservations pending jamais expirées) ou
 * la DB est injoignable. Réponse volontairement grossière : aucun détail
 * interne exploitable.
 */
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' }

  if (!supabaseAdmin) {
    return NextResponse.json({ status: 'degraded', cron: 'unknown' }, { status: 503, headers })
  }

  const { data, error } = await supabaseAdmin
    .from('cron_heartbeats')
    .select('last_run_at')
    .eq('job_name', 'expire-stale-reservations')
    .maybeSingle()

  const lastRun = data?.last_run_at ? new Date(data.last_run_at).getTime() : 0
  const cronOk = !error && lastRun > Date.now() - CRON_STALE_MS

  return NextResponse.json(
    { status: cronOk ? 'ok' : 'degraded', cron: cronOk ? 'ok' : 'stale' },
    { status: cronOk ? 200 : 503, headers },
  )
}
