import { logger } from '@/lib/logger'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type RateLimitResult = {
  allowed: boolean
  retryAfter: number
}

/**
 * Vérifie un bucket de rate limit côté Postgres (RPC check_rate_limit).
 *
 * Stratégie fail-open : si la RPC échoue ou si supabaseAdmin n'est pas
 * configuré, on log et on laisse passer la requête (mieux que de se
 * DoS soi-même sur un incident DB).
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSec: number,
): Promise<RateLimitResult> {
  if (!supabaseAdmin) {
    logger.error('[rateLimit] supabaseAdmin null, fail-open')
    return { allowed: true, retryAfter: 0 }
  }

  const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
    p_key: key,
    p_max: max,
    p_window_sec: windowSec,
  })

  if (error) {
    logger.error('[rateLimit] RPC error, fail-open:', error.message)
    return { allowed: true, retryAfter: 0 }
  }

  const row = Array.isArray(data) ? data[0] : data
  return {
    allowed: row?.allowed ?? true,
    retryAfter: row?.retry_after ?? 0,
  }
}

/**
 * Extrait l'IP client de façon non-spoofable, par ordre de confiance.
 *
 * ⚠️ Ne JAMAIS utiliser le 1er hop de `x-forwarded-for` : il est entièrement
 * contrôlé par l'appelant (CWE-348). Un attaquant le ferait tourner pour
 * obtenir un bucket de rate-limit neuf à chaque requête.
 *
 * 1. `x-vercel-forwarded-for` (1er hop) — posé/écrasé par l'edge Vercel, fiable.
 * 2. fallback hors-Vercel : DERNIER hop de `x-forwarded-for` (proxy de confiance le plus proche).
 * 3. `x-real-ip`.
 * 4. `'unknown'` (un bucket "unknown" reste un bucket).
 */
export function getClientIp(request: Request): string {
  const vercel = request.headers.get('x-vercel-forwarded-for')
  if (vercel) {
    const first = vercel.split(',')[0]?.trim()
    if (first) return first
  }

  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) {
    const hops = fwd.split(',').map((s) => s.trim()).filter(Boolean)
    if (hops.length > 0) return hops[hops.length - 1]
  }

  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}
