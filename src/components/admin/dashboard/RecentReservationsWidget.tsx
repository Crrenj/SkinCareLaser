import Link from 'next/link'
import { StatusBadge, type ReservationStatus } from './StatusBadge'
import { formatPrice } from '@/lib/formatPrice'

export type ReservationRow = {
  id: string
  reference: string
  contactName: string
  status: ReservationStatus
  totalPrice: number
  whatsappOpened: boolean
}

const fmtDOP = (n: number) => formatPrice(n)

export function RecentReservationsWidget({ rows }: { rows: ReservationRow[] }) {
  return (
    <article className="bg-sand-50 border border-sand-300 rounded-xl p-5 lg:p-6 flex flex-col gap-3.5 col-span-12 lg:col-span-6">
      <div className="flex justify-between items-baseline">
        <div>
          <h3 className="font-serif text-[20px] text-ink-900 m-0 mb-0.5">Reservas recientes</h3>
          <small className="text-[11.5px] text-ink-500">
            Últimas {rows.length} · 💬 = cliente abrió WhatsApp
          </small>
        </div>
        <Link
          href="/admin/reservations"
          className="text-[11.5px] tracking-[0.06em] text-ink-700 hover:text-ink-900 border-b border-transparent hover:border-current transition-colors"
        >
          Ver todas →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-[13px] text-ink-500 py-6 text-center">
          Sin reservas recientes.
        </p>
      ) : (
        <div className="flex flex-col">
          {rows.map((r, i) => (
            <Link
              key={r.id}
              href={`/admin/reservations?id=${r.id}`}
              className={`grid grid-cols-[auto_minmax(0,1fr)_auto_auto] gap-3 items-center py-2.5 text-[13px] no-underline text-inherit ${
                i < rows.length - 1 ? 'border-b border-sand-200' : ''
              } hover:bg-sand-100 px-1 -mx-1 rounded transition-colors`}
            >
              <span className="font-mono text-[11.5px] text-ink-700 font-medium whitespace-nowrap">
                {r.reference}
              </span>
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="font-medium text-ink-900 text-[13.5px] truncate">
                  {r.contactName || '—'}
                </span>
                {r.whatsappOpened && (
                  <span title="Cliente abrió WhatsApp" className="text-[13px] shrink-0">
                    💬
                  </span>
                )}
              </span>
              <StatusBadge status={r.status} />
              <span className="font-serif text-[15px] text-ink-900 text-right whitespace-nowrap min-w-[80px] hidden sm:inline-block">
                {fmtDOP(r.totalPrice)}
                <small className="font-sans text-[10px] text-ink-500 ml-0.5">DOP</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </article>
  )
}
