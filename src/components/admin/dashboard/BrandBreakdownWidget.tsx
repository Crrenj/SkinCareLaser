import { WidgetCard } from './WidgetCard'
import { MeterBar } from './MeterBar'

export type BrandBar = { name: string; products: number; units: number }

/**
 * Répartition du catalogue par marque (barres triées). Donne la structure
 * du portefeuille en un coup d'œil — quelles marques pèsent le plus.
 */
export function BrandBreakdownWidget({
  bars,
  className,
}: {
  bars: BrandBar[]
  className?: string
}) {
  const max = Math.max(1, ...bars.map((b) => b.products))

  return (
    <WidgetCard
      title="Catálogo por marca"
      subtitle={`${bars.length} marcas activas`}
      link={{ href: '/admin/marques', label: 'Ver marcas →' }}
      gap="gap-3"
      className={className}
    >
      {bars.length === 0 ? (
        <p className="text-[13px] text-ink-500 py-6 text-center">Sin marcas.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-3">
          {bars.map((b) => (
            <MeterBar
              key={b.name}
              label={b.name}
              value={b.products}
              total={max}
              accent="clay"
              valueText={String(b.products)}
            />
          ))}
        </div>
      )}
    </WidgetCard>
  )
}
