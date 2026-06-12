import { AlertTriangle } from 'lucide-react'
import { WidgetCard } from './WidgetCard'
import { formatPrice } from '@/lib/formatPrice'

export type InventoryStats = {
  units: number
  stockValue: number
  activeProducts: number
  /** Produits encore au prix placeholder (100 DOP). */
  placeholderPriced: number
  distribution: { inStock: number; low: number; oos: number }
  /** Seuil « stock bajo » configuré (shop_settings.low_stock_threshold). */
  lowThreshold: number
}

const fmt = (n: number) => formatPrice(n, { fractionDigits: 0 })

function Segment({
  label,
  value,
  total,
  color,
  bar,
}: {
  label: string
  value: number
  total: number
  color: string
  bar: string
}) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-[12.5px]">
        <span className="inline-flex items-center gap-1.5 text-ink-700">
          <span className={`w-2 h-2 rounded-full ${color}`} aria-hidden />
          {label}
        </span>
        <span className="font-mono text-[12px] text-ink-900 tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-sand-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${bar}`}
          style={{ width: `${value > 0 ? Math.max(pct, 2) : 0}%` }}
        />
      </div>
    </div>
  )
}

export function InventoryWidget({
  data,
  className,
}: {
  data: InventoryStats
  className?: string
}) {
  const { distribution: d } = data
  const allPlaceholder =
    data.activeProducts > 0 && data.placeholderPriced === data.activeProducts

  return (
    <WidgetCard
      title="Inventario"
      subtitle="Unidades y disponibilidad"
      link={{ href: '/admin/stock', label: 'Ver stock →' }}
      gap="gap-4"
      className={className}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10.5px] tracking-[0.14em] uppercase text-ink-500 font-semibold">
            Unidades
          </span>
          <span className="font-serif text-[32px] lg:text-[36px] leading-none text-ink-900 tracking-[-0.01em]">
            {fmt(data.units)}
          </span>
          <span className="text-[11px] text-ink-500 mt-0.5">
            en {data.activeProducts} productos
          </span>
        </div>
        <div className="flex flex-col gap-0.5 sm:border-l sm:border-sand-300 sm:pl-4">
          <span className="text-[10.5px] tracking-[0.14em] uppercase text-ink-500 font-semibold">
            Valor stock
          </span>
          <span className="font-serif text-[26px] lg:text-[30px] leading-none text-ink-900 tracking-[-0.01em] whitespace-nowrap">
            {fmt(data.stockValue)}
            <small className="font-sans text-[12px] text-ink-500 font-medium ml-1">DOP</small>
          </span>
          {allPlaceholder && (
            <span className="text-[11px] text-ochre-600 mt-0.5">precio placeholder</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pt-1">
        <Segment
          label="En stock"
          value={d.inStock}
          total={data.activeProducts}
          color="bg-olive-600"
          bar="bg-olive-600"
        />
        <Segment
          label={`Stock bajo (≤ ${data.lowThreshold})`}
          value={d.low}
          total={data.activeProducts}
          color="bg-ochre-600"
          bar="bg-ochre-600"
        />
        <Segment
          label="Agotado"
          value={d.oos}
          total={data.activeProducts}
          color="bg-brick-600"
          bar="bg-brick-600"
        />
      </div>

      {data.placeholderPriced > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-ochre-600/10 px-3 py-2.5 text-[11.5px] text-ink-700 leading-[1.45]">
          <AlertTriangle className="w-3.5 h-3.5 text-ochre-600 shrink-0 mt-px" />
          <span>
            <b className="font-semibold text-ink-900">{data.placeholderPriced}</b> productos con
            precio placeholder (100 DOP) por configurar.
          </span>
        </div>
      )}
    </WidgetCard>
  )
}
