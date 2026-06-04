/**
 * Canonicalisation des cibles de redirection non fiables (querystring `next`,
 * `redirectedFrom`, `sessionStorage('redirect_to')`).
 *
 * Objectif : empêcher l'open-redirect (phishing post-login). On n'autorise QUE
 * des chemins INTERNES — tout chemin localisé (`/fr/...`) ou admin (`/admin/...`)
 * est licite ; toute cible externe/ambiguë est rejetée (→ `null`).
 *
 * Vecteurs bloqués : URL absolue (`https://…`), schéma (`javascript:`, `data:`…),
 * protocol-relative (`//evil.com`), backslash (`/\evil.com`), traversal `..`
 * (brut + décodé), slash/backslash encodés (`%2f`/`%5c`), percent-encoding malformé.
 */
export function safeRedirectPath(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null

  const raw = input.trim()
  if (!raw) return null

  // Schéma absolu : http:, https:, javascript:, data:, mailto:, etc.
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return null

  // Doit être un chemin absolu interne (un seul slash de tête).
  if (!raw.startsWith('/')) return null

  // Protocol-relative `//host` ou backslash tricks `/\host`.
  if (raw.startsWith('//') || raw.startsWith('/\\')) return null
  if (raw.includes('\\')) return null

  // Slash/backslash encodés (contournent les checks ci-dessus une fois décodés).
  if (/%2f/i.test(raw) || /%5c/i.test(raw)) return null

  // Décodage : rejette le percent-encoding malformé + re-check traversal/protocol-relative.
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  if (raw.includes('..') || decoded.includes('..')) return null
  if (decoded.startsWith('//') || decoded.includes('\\')) return null

  return raw
}

/**
 * `safeRedirectPath` avec fallback garanti (lui-même re-validé). Ne retourne
 * jamais une cible non sûre.
 */
export function safeRedirectOr(
  input: string | null | undefined,
  fallback: string,
): string {
  return safeRedirectPath(input) ?? safeRedirectPath(fallback) ?? '/'
}
