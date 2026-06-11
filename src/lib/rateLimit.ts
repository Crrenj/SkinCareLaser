import { logger } from '@/lib/logger'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type RateLimitResult = {
  allowed: boolean
  retryAfter: number
}

/**
 * Options du rate-limiter.
 *
 * `failClosed` : politique en cas de panne (RPC `check_rate_limit` qui échoue
 * ou `supabaseAdmin` absent). Opt-in, défaut `false` :
 *  - `false` (défaut) → FAIL-OPEN : on laisse passer (mieux que de se DoS
 *    soi-même sur un incident DB). Comportement HISTORIQUE — les call-sites
 *    existants (contact, newsletter, guest-reserve, cart, search) restent
 *    inchangés tant qu'ils ne passent pas l'option.
 *  - `true` → FAIL-CLOSED : on REFUSE (allowed:false) avec un `retryAfter`
 *    raisonnable. À réserver aux écritures sensibles où laisser passer en cas
 *    de panne est pire que de refuser temporairement.
 */
export type RateLimitOptions = {
  failClosed?: boolean
}

// Délai de réessai (s) renvoyé quand on refuse en mode fail-closed : court
// pour ne pas punir durablement un client légitime pendant un incident DB.
const FAIL_CLOSED_RETRY_AFTER = 30

/**
 * Vérifie un bucket de rate limit côté Postgres (RPC check_rate_limit).
 *
 * Politique de panne pilotée par `options.failClosed` (cf. RateLimitOptions).
 * Dans TOUS les cas de panne, on émet une trace structurée et grep-able
 * (`[rate-limit] fail-open` / `[rate-limit] fail-closed`) incluant la clé du
 * bucket et l'erreur : c'est la métrique comptable des événements de panne du
 * rate-limiter (les 5xx applicatifs, eux, sont déjà captés par Sentry).
 *
 * @param key       identifiant du bucket (ex. `contact:<ip>`, `cart:<ip>`).
 * @param max       nombre max de requêtes par fenêtre.
 * @param windowSec largeur de la fenêtre, en secondes.
 * @param options   `{ failClosed }` — défaut fail-open (rétro-compatible).
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSec: number,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const failClosed = options.failClosed ?? false

  if (!supabaseAdmin) {
    return onFailure(key, 'supabaseAdmin null', failClosed)
  }

  const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
    p_key: key,
    p_max: max,
    p_window_sec: windowSec,
  })

  if (error) {
    return onFailure(key, error.message, failClosed)
  }

  const row = Array.isArray(data) ? data[0] : data
  return {
    allowed: row?.allowed ?? true,
    retryAfter: row?.retry_after ?? 0,
  }
}

/**
 * Centralise la trace + la décision en cas de panne du rate-limiter.
 * Le marqueur (`[rate-limit] fail-open` / `[rate-limit] fail-closed`) est
 * volontairement stable pour être agrégé/alerté côté logs.
 */
function onFailure(
  key: string,
  reason: string,
  failClosed: boolean,
): RateLimitResult {
  if (failClosed) {
    logger.warn('[rate-limit] fail-closed', { key, reason })
    return { allowed: false, retryAfter: FAIL_CLOSED_RETRY_AFTER }
  }
  logger.warn('[rate-limit] fail-open', { key, reason })
  return { allowed: true, retryAfter: 0 }
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
