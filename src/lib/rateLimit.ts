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
 * Extrait l'IP client depuis les headers Vercel/proxy. Fallback "unknown"
 * pour ne jamais retourner null (un bucket "unknown" reste un bucket).
 */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}
