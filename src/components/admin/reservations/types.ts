import { formatPrice } from '@/lib/formatPrice'

/**
 * Status DB existants (5 valeurs enum).
 * Le design théorique mentionne "Contactada" en plus mais la valeur
 * n'existe pas encore dans l'enum côté DB — à ajouter en migration
 * dédiée si besoin.
 *
 * Les libellés localisés (statut, action « marquer X », temps relatif) vivent
 * dans le hook `useReservationFormat` (namespace i18n `Admin.reservations`).
 */
export type DbReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'collected'
  | 'expired'
  | 'cancelled'

export type StatusFilter = DbReservationStatus | 'all'

/** Origine d'une réservation/vente. */
export type ReservationSource = 'account' | 'guest' | 'counter'

export type ReservationItem = {
  id: string
  product_id: string | null
  product_name: string
  unit_price: number
  quantity: number
}

export type Reservation = {
  id: string
  status: DbReservationStatus
  expires_at: string
  created_at: string
  updated_at: string
  confirmed_at: string | null
  collected_at: string | null
  contact_phone: string | null
  contact_email: string | null
  contact_name: string | null
  total_items: number
  total_price: number
  currency: string
  admin_notes: string | null
  source: ReservationSource
  items: ReservationItem[]
}

export const STATUS_BADGE_CLASS: Record<DbReservationStatus, string> = {
  pending: 'bg-clay-200 text-clay-800',
  confirmed: 'bg-olive-600/15 text-olive-600',
  collected: 'bg-ink-200 text-ink-800',
  expired: 'bg-sand-300 text-ink-800',
  cancelled: 'bg-brick-600/12 text-brick-600',
}

/** Pastille d'origine (compte / web invité / comptoir). */
export const ORIGIN_CHIP_CLASS: Record<ReservationSource, string> = {
  account: 'bg-sand-200 text-ink-700',
  guest: 'bg-clay-200 text-clay-800',
  counter: 'bg-olive-600/15 text-olive-600',
}

/**
 * Bouton "marcar X" du drawer — étape suivante linéaire.
 * pending → confirmed → collected. expired/cancelled = terminal.
 */
export function nextStatusFor(s: DbReservationStatus): DbReservationStatus | null {
  if (s === 'pending') return 'confirmed'
  if (s === 'confirmed') return 'collected'
  return null
}

export function buildReservationRef(id: string, createdAt: string): string {
  const d = new Date(createdAt)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const idPart = id.replace(/-/g, '').slice(0, 4).toUpperCase()
  return `FAR-${y}${m}${day}-${idPart}`
}

export function fmtDOP(n: number, fractional = 2): string {
  return formatPrice(n, { fractionDigits: fractional })
}
