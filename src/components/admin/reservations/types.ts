import { formatPrice } from '@/lib/formatPrice'

/**
 * Status DB existants (5 valeurs enum) + label ES par défaut.
 * Le design théorique mentionne "Contactada" en plus mais la valeur
 * n'existe pas encore dans l'enum côté DB — à ajouter en migration
 * dédiée si besoin.
 */
export type DbReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'collected'
  | 'expired'
  | 'cancelled'

export type StatusFilter = DbReservationStatus | 'all'

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
  contact_phone: string
  contact_email: string | null
  contact_name: string | null
  total_items: number
  total_price: number
  currency: string
  admin_notes: string | null
  items: ReservationItem[]
}

export const STATUS_LABEL_ES: Record<DbReservationStatus, string> = {
  pending: 'Reservada',
  confirmed: 'Confirmada',
  collected: 'Entregada',
  expired: 'Expirada',
  cancelled: 'Cancelada',
}

export const STATUS_BADGE_CLASS: Record<DbReservationStatus, string> = {
  pending: 'bg-clay-200 text-clay-800',
  confirmed: 'bg-olive-600/15 text-olive-600',
  collected: 'bg-ink-200 text-ink-800',
  expired: 'bg-sand-300 text-ink-800',
  cancelled: 'bg-brick-600/12 text-brick-600',
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

export function nextStatusLabel(s: DbReservationStatus): string | null {
  const next = nextStatusFor(s)
  if (!next) return null
  if (next === 'confirmed') return 'Marcar confirmada'
  if (next === 'collected') return 'Marcar entregada'
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

const ABS_DATE_FMT = new Intl.DateTimeFormat('es-DO', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function relativeAndAbsolute(iso: string | null | undefined): {
  rel: string
  abs: string
} {
  if (!iso) return { rel: '—', abs: '' }
  const d = new Date(iso)
  const abs = ABS_DATE_FMT.format(d)
  const seconds = Math.round((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return { rel: 'Justo ahora', abs }
  if (seconds < 3600) return { rel: `Hace ${Math.floor(seconds / 60)} min`, abs }
  if (seconds < 86400) return { rel: `Hace ${Math.floor(seconds / 3600)} h`, abs }
  if (seconds < 172800) return { rel: 'Ayer', abs }
  const days = Math.floor(seconds / 86400)
  if (days < 7) return { rel: `Hace ${days} días`, abs }
  return { rel: abs, abs }
}

export function fmtDOP(n: number, fractional = 2): string {
  return formatPrice(n, { fractionDigits: fractional })
}
