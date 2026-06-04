import { NextRequest, NextResponse } from 'next/server'

const VERCEL_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : null
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? null

function getAllowedOrigins(): string[] {
  const origins: string[] = ['http://localhost:3000']
  if (SITE_URL) origins.push(SITE_URL)
  if (VERCEL_URL) origins.push(VERCEL_URL)
  return origins
}

/** URL de base de confiance (côté serveur) — ne jamais dériver d'un header client. */
export function getSiteUrl(): string {
  return SITE_URL ?? VERCEL_URL ?? 'https://farmau.do'
}

/**
 * Une requête est légitime (CSRF) si :
 *  - aucun header `Origin` (navigation top-level / certains GET same-origin), OU
 *  - l'host de l'`Origin` == `Host` de la requête → same-origin, **robuste et
 *    indépendant de toute var d'env** (ne casse jamais la prod si SITE_URL est
 *    mal configurée), OU
 *  - l'`Origin` figure dans l'allowlist configurée (localhost/SITE_URL/VERCEL_URL).
 */
function isAllowedOrigin(origin: string | null, host: string | null): boolean {
  if (!origin) return true
  let originHost: string | null
  try {
    originHost = new URL(origin).host
  } catch {
    return false // Origin présent mais non parsable → suspect
  }
  if (host && originHost === host) return true
  return getAllowedOrigins().some((o) => origin === o)
}

const originRejected = () =>
  NextResponse.json({ error: 'origin_rejected' }, { status: 403 })

/** Garde CSRF par Origin pour un contexte disposant d'un `NextRequest`. */
export function checkOrigin(request: NextRequest): NextResponse | null {
  return isAllowedOrigin(request.headers.get('origin'), request.headers.get('host'))
    ? null
    : originRejected()
}

/**
 * Variante pour les contextes sans `NextRequest` (ex. `requireAdmin` qui lit
 * `await headers()`) → centralise la garde CSRF sur toutes les routes admin.
 */
export function assertOriginFromHeaders(h: Headers): NextResponse | null {
  return isAllowedOrigin(h.get('origin'), h.get('host')) ? null : originRejected()
}

/**
 * Exige un body JSON (`Content-Type: application/json`). Bloque le vecteur
 * form-CSRF « simple request » (un `<form>` cross-site ne peut pas émettre de
 * `application/json`). À n'appliquer qu'aux routes qui LISENT un body JSON.
 */
export function checkContentType(request: NextRequest): NextResponse | null {
  const ct = (request.headers.get('content-type') ?? '').toLowerCase()
  return ct.includes('application/json')
    ? null
    : NextResponse.json({ error: 'unsupported_media_type' }, { status: 415 })
}

/**
 * Garde combinée pour une route mutante (POST/PATCH/PUT/DELETE) :
 *  - vérifie toujours l'`Origin` (CSRF) ;
 *  - si `json` (défaut `true`) : exige aussi `Content-Type: application/json`.
 *
 * Passer `{ json: false }` pour les requêtes **sans body** (DELETE par query,
 * POST sans payload comme `cart/merge`, `cart/reserve`).
 */
export function guardMutation(
  request: NextRequest,
  { json = true }: { json?: boolean } = {},
): NextResponse | null {
  return checkOrigin(request) ?? (json ? checkContentType(request) : null)
}
