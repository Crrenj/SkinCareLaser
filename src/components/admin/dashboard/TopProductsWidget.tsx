import Link from 'next/link'
import { formatPrice } from '@/lib/formatPrice'

export type TopProductRow = {
  productId: string | null
  name: string
  brand: string | null
  units: number
  totalDop: number
}

const fmtDOP = (n: number) => formatPrice(Math.round(n), { fractionDigits: 0 })

export function TopProductsWidget({ rows }: { rows: TopProductRow[] }) {
  return (
    <article className="bg-sand-50 border border-sand-300 rounded-xl p-5 lg:p-6 flex flex-col gap-3.5 col-span-12 lg:col-span-6">
      <div className="flex justify-between items-baseline">
        <div>
          <h3 className="font-serif text-[20px] text-ink-900 m-0 mb-0.5">Top productos</h3>
          <small className="text-[11.5px] text-ink-500">30 días · por unidades reservadas</small>
        </div>
        <Link
          href="/admin/product"
          className="text-[11.5px] tracking-[0.06em] text-ink-700 hover:text-ink-900 border-b border-transparent hover:border-current transition-colors"
        >
          Ver catálogo →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-[13px] text-ink-500 py-6 text-center">
          Sin ventas en los últimos 30 días.
        </p>
      ) : (
        <div className="flex flex-col">
          {rows.map((row, i) => (
            <div
              key={`${row.productId ?? row.name}-${i}`}
              className={`grid grid-cols-[20px_40px_minmax(0,1fr)_auto] gap-3 items-center py-2.5 text-[13px] ${
                i < rows.length - 1 ? 'border-b border-sand-200' : ''
              }`}
            >
              <span
                className={`font-serif text-[22px] text-center leading-none ${
                  i === 0 ? 'text-clay-700' : 'text-ink-500'
                }`}
              >
                {i + 1}
              </span>
              <span className="w-10 h-10 bg-sand-200 rounded text-[8px] tracking-[0.08em] uppercase text-ink-500 inline-flex items-center justify-center">
                Pack
              </span>
              <div className="min-w-0">
                <b className="font-medium text-ink-900 block truncate">{row.name}</b>
                {row.brand && (
                  <small className="block text-[11px] text-ink-500 mt-0.5 uppercase tracking-[0.06em]">
                    {row.brand}
                  </small>
                )}
              </div>
              <div className="text-right text-[12px] leading-[1.4]">
                <b className="font-serif text-[16px] text-ink-900 font-normal block">
                  {row.units} uds
                </b>
                <small className="text-ink-500 text-[11px]">{fmtDOP(row.totalDop)} DOP</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
