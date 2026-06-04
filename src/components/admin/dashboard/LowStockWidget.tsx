import Link from 'next/link'
import { Check } from 'lucide-react'

export type LowStockItem = {
  id: string
  name: string
  brand: string | null
  volume: string | null
  stock: number
}

type Props = { items: LowStockItem[]; className?: string }

export function LowStockWidget({ items, className = 'col-span-12' }: Props) {
  return (
    <article className={`bg-sand-50 border border-sand-300 rounded-xl p-5 lg:p-6 flex flex-col gap-3.5 ${className}`}>
      <div className="flex justify-between items-baseline">
        <div>
          <h3 className="font-serif text-[20px] text-ink-900 m-0 mb-0.5">Stock crítico</h3>
          <small className="text-[11.5px] text-ink-500">Menos de 5 unidades</small>
        </div>
        <Link
          href="/admin/stock"
          className="text-[11.5px] tracking-[0.06em] text-ink-700 hover:text-ink-900 border-b border-transparent hover:border-current transition-colors"
        >
          Ver todo →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-6 px-3 text-center flex flex-col items-center gap-2 text-[13px] text-olive-600">
          <span className="w-8 h-8 rounded-full bg-olive-600/15 text-olive-600 inline-flex items-center justify-center">
            <Check className="w-4 h-4" />
          </span>
          <strong className="font-semibold">Todos los productos en stock</strong>
          <span className="text-[11.5px] text-ink-500">Nada urgente que reabastecer.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/admin/stock?product=${p.id}`}
              className="grid grid-cols-[32px_1fr_auto] gap-2.5 items-center px-3 py-2.5 rounded-md bg-sand-100 hover:bg-sand-200 text-[13px] no-underline transition-colors"
            >
              <span className="w-8 h-8 bg-sand-200 rounded text-[8px] tracking-[0.08em] uppercase text-ink-500 inline-flex items-center justify-center">
                Pack
              </span>
              <span className="font-medium text-ink-900 leading-[1.3] min-w-0">
                <span className="truncate block">{p.name}</span>
                <small className="block text-[11px] font-normal text-ink-500 mt-0.5 truncate">
                  {[p.brand, p.volume].filter(Boolean).join(' · ')}
                </small>
              </span>
              <span className="font-mono text-[12px] font-semibold text-brick-600 bg-brick-600/8 px-2 py-0.5 rounded-full whitespace-nowrap">
                {p.stock} uds
              </span>
            </Link>
          ))}
        </div>
      )}
    </article>
  )
}
