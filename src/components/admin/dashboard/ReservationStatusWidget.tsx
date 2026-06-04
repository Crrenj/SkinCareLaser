import { WidgetCard } from './WidgetCard'
import { StatusBadge, type ReservationStatus } from './StatusBadge'
import { formatPrice } from '@/lib/formatPrice'

export type ReservationStatusStats = {
  byStatus: Record<ReservationStatus, { n: number; revenue: number; items: number }>
  totalReservations: number
  /** pending + confirmed (en attente d'action). */
  activeCount: number
  /** confirmed + collected. */
  confirmedRevenue: number
  avgBasket: number
}

const ORDER: ReservationStatus[] = [
  'pending',
  'confirmed',
  'collected',
  'expired',
  'cancelled',
]

const fmt = (n: number) => formatPrice(n, { fractionDigits: 0 })

export function ReservationStatusWidget({
  data,
  className,
}: {
  data: ReservationStatusStats
  className?: string
}) {
  return (
    <WidgetCard
      title="Reservas por estado"
      subtitle={`${data.totalReservations} en total · ${data.activeCount} activas`}
      link={{ href: '/admin/reservations', label: 'Ver reservas →' }}
      gap="gap-4"
      className={className}
    >
      <div className="flex items-end gap-4 flex-wrap pb-1 border-b border-sand-200">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10.5px] tracking-[0.14em] uppercase text-ink-500 font-semibold">
            Ingreso confirmado
          </span>
          <span className="font-serif text-[30px] lg:text-[34px] leading-none text-ink-900 tracking-[-0.01em] whitespace-nowrap">
            {fmt(data.confirmedRevenue)}
            <small className="font-sans text-[12px] text-ink-500 font-medium ml-1">DOP</small>
          </span>
        </div>
        <div className="flex flex-col gap-0.5 pb-0.5">
          <span className="text-[11px] text-ink-500">Cesta media</span>
          <span className="font-serif text-[18px] text-ink-900 leading-none">
            {fmt(data.avgBasket)} <small className="font-sans text-[11px] text-ink-500">DOP</small>
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        {ORDER.map((status, i) => {
          const row = data.byStatus[status]
          return (
            <div
              key={status}
              className={`flex items-center gap-3 py-2 ${
                i < ORDER.length - 1 ? 'border-b border-sand-200' : ''
              }`}
            >
              <StatusBadge status={status} />
              <span className="font-mono text-[12px] text-ink-700 tabular-nums">{row.n}</span>
              <span className="ml-auto font-serif text-[14px] text-ink-900 whitespace-nowrap">
                {fmt(row.revenue)}
                <small className="font-sans text-[10px] text-ink-500 ml-0.5">DOP</small>
              </span>
            </div>
          )
        })}
      </div>
    </WidgetCard>
  )
}
