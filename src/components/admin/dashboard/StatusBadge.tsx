type DbStatus = 'pending' | 'confirmed' | 'collected' | 'expired' | 'cancelled'

const LABELS: Record<DbStatus, string> = {
  pending: 'Reservada',
  confirmed: 'Confirmada',
  collected: 'Entregada',
  expired: 'Expirada',
  cancelled: 'Cancelada',
}

const STYLES: Record<DbStatus, string> = {
  pending: 'bg-clay-200 text-clay-800',
  confirmed: 'bg-olive-600/15 text-olive-600',
  collected: 'bg-ink-200 text-ink-800',
  expired: 'bg-sand-300 text-ink-800',
  cancelled: 'bg-brick-600/12 text-brick-600',
}

/**
 * Pastille de statut réservation. La liste est fermée — aucune référence
 * à un paiement en ligne. Convertit le statut DB en label Spanish.
 */
export function StatusBadge({ status }: { status: DbStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
        STYLES[status]
      }`}
    >
      {LABELS[status]}
    </span>
  )
}

export type { DbStatus as ReservationStatus }
