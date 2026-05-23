/**
 * Helpers de référence de réservation.
 *
 * Format canonique : `FAR-YYYYMMDD-XXXX`
 *   - YYYYMMDD : created_at UTC (fallback : maintenant)
 *   - XXXX     : 4 premiers caractères hex de l'UUID (majuscule)
 *
 * Affiché sur la confirmation, l'historique account et les CGV.
 * La version compacte `FAR-…XXXX` (sans date) reste utilisée dans les
 * widgets admin denses (overview dashboard).
 */

function datePart(createdAt: string | null | undefined): string {
  const d = createdAt ? new Date(createdAt) : new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function idPart(id: string, length = 4): string {
  return id.replace(/-/g, '').slice(0, length).toUpperCase()
}

export function buildReservationReference(
  id: string,
  createdAt: string | null | undefined = null,
): string {
  return `FAR-${datePart(createdAt)}-${idPart(id, 4)}`
}

/** Compact form for dense admin widgets : `FAR-…XXXX`. */
export function buildReservationReferenceCompact(id: string): string {
  return `FAR-…${idPart(id, 4)}`
}
