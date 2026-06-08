import Link from 'next/link'
import {
  TrendingUp,
  Coins,
  Percent,
  Warehouse,
  Store,
  Globe,
  UserRound,
  AlertTriangle,
  ArrowRight,
  Download,
} from 'lucide-react'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { StatCard } from '@/components/admin/dashboard/StatCard'
import { WidgetCard } from '@/components/admin/dashboard/WidgetCard'
import { MeterBar } from '@/components/admin/dashboard/MeterBar'
import { MiniStat } from '@/components/admin/dashboard/MiniStat'
import { DashboardSectionHeader } from '@/components/admin/dashboard/DashboardSectionHeader'
import { formatPrice } from '@/lib/formatPrice'
import { getAccountingData, recentMonths, type ChannelKey } from './_data'
import { MonthSelect } from './MonthSelect'

export const dynamic = 'force-dynamic'

const money = (n: number) => formatPrice(n)
const pctFmt = new Intl.NumberFormat('es-DO', { style: 'percent', maximumFractionDigits: 1 })
const pct = (x: number) => pctFmt.format(x)
const int = (n: number) => formatPrice(n)

const CHANNEL: Record<ChannelKey, { label: string; icon: React.ComponentType<{ className?: string }>; accent: 'olive' | 'clay' | 'ink' }> = {
  counter: { label: 'Mostrador', icon: Store, accent: 'olive' },
  guest: { label: 'Web (invitado)', icon: Globe, accent: 'clay' },
  account: { label: 'Cuenta cliente', icon: UserRound, accent: 'ink' },
}

/** Variation relative en texte coloré, ou tiret si pas de base. */
function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (prev <= 0) return <span className="text-ink-500 font-mono text-[11px]">—</span>
  const d = (cur - prev) / prev
  const up = d >= 0
  return (
    <span className={`font-mono text-[11px] tabular-nums ${up ? 'text-olive-600' : 'text-brick-600'}`}>
      {up ? '+' : '−'}
      {Math.abs(Math.round(d * 100))}%
    </span>
  )
}

export default async function ContabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  const data = await getAccountingData(month)
  const { current: cur, previous: prev, inventory: inv, purchases: pur } = data
  const months = recentMonths(12)

  const hasCost = cur.costedRevenue > 0

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'General' }, { label: 'Contabilidad' }]}
        title="Contabilidad"
        actions={<MonthSelect value={data.month} options={months} />}
      />

      <div className="px-5 lg:px-8 py-6 flex flex-col gap-7">
        {/* Bande KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Ingresos del mes"
            value={money(cur.totalRevenue)}
            unit="DOP"
            sub={`${int(cur.totalUnits)} uds · ${int(cur.salesCount)} ventas`}
            icon={TrendingUp}
            accent="olive"
          />
          <StatCard
            label="Coste de ventas"
            value={money(cur.cogs)}
            unit="DOP"
            sub={`${pct(cur.coveragePct)} del CA con coste`}
            icon={Coins}
            accent="ochre"
          />
          <StatCard
            label="Margen bruto"
            value={hasCost ? money(cur.grossMargin) : '—'}
            unit={hasCost ? 'DOP' : undefined}
            sub={hasCost ? `${pct(cur.marginPct)} de margen` : 'sin costes aún'}
            icon={Percent}
            accent="clay"
          />
          <StatCard
            label="Inventario al coste"
            value={money(inv.costValue)}
            unit="DOP"
            sub={`venta: ${money(inv.retailValue)}`}
            icon={Warehouse}
            accent="ink"
          />
        </div>

        {/* Exportar para la DGII */}
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-ink-500 font-semibold mr-1">
            Exportar DGII
          </span>
          <a
            href={`/api/admin/accounting/export?type=606&month=${data.month}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-ink-700 bg-sand-50 border border-sand-300 rounded-md hover:border-clay-700 hover:text-ink-900 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> 606 · Compras
          </a>
          <a
            href={`/api/admin/accounting/export?type=607&month=${data.month}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-ink-700 bg-sand-50 border border-sand-300 rounded-md hover:border-clay-700 hover:text-ink-900 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> 607 · Ventas <span className="text-ink-500">(borrador)</span>
          </a>
        </div>

        {/* 01 · Resultado del mes */}
        <section className="flex flex-col gap-3.5">
          <DashboardSectionHeader index="01" title="Resultado del mes" description={data.monthLabel} />
          <div className="grid grid-cols-12 gap-3 lg:gap-4">
            <WidgetCard title="Resultado del mes" className="col-span-12 lg:col-span-7">
              <div className="grid grid-cols-3 gap-2.5">
                <MiniStat label="Ingresos" value={money(cur.totalRevenue)} sub="DOP" />
                <MiniStat label="− Coste de ventas" value={money(cur.cogs)} sub={`${pct(cur.coveragePct)} cubierto`} />
                <MiniStat label="= Margen bruto" value={hasCost ? money(cur.grossMargin) : '—'} sub={hasCost ? pct(cur.marginPct) : 'sin costes'} />
              </div>

              <MeterBar
                label="Cobertura de coste (CA con coste conocido)"
                value={cur.costedRevenue}
                total={cur.totalRevenue}
                accent="olive"
                valueText={pct(cur.coveragePct)}
              />

              {!hasCost && (
                <p className="text-[12.5px] text-ink-500 leading-snug bg-sand-100 border border-sand-300 rounded-md p-3">
                  Aún no hay costes en las ventas de este período. Registra{' '}
                  <Link href="/admin/stock" className="text-clay-700 hover:underline">
                    entradas de stock
                  </Link>{' '}
                  para que el margen se calcule automáticamente en las próximas ventas.
                </p>
              )}

              {/* Comparativa vs mes anterior */}
              <div className="border-t border-sand-200 pt-3 flex flex-col gap-1.5">
                {(
                  [
                    ['Ingresos', cur.totalRevenue, prev.totalRevenue],
                    ['Coste de ventas', cur.cogs, prev.cogs],
                    ['Margen bruto', cur.grossMargin, prev.grossMargin],
                  ] as const
                ).map(([label, c, p]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                    <span className="text-ink-700">{label}</span>
                    <span className="flex items-baseline gap-2.5">
                      <span className="font-mono text-ink-900 tabular-nums">{money(c)}</span>
                      <Delta cur={c} prev={p} />
                    </span>
                  </div>
                ))}
                <span className="text-[11px] text-ink-500 mt-0.5">Δ vs mes anterior</span>
              </div>
            </WidgetCard>

            <WidgetCard title="Ventas por canal" subtitle="Reparto de ingresos del mes" className="col-span-12 lg:col-span-5">
              {cur.totalRevenue === 0 ? (
                <p className="text-[12.5px] text-ink-500 py-2">Sin ventas en este período.</p>
              ) : (
                <div className="flex flex-col gap-3 pt-1">
                  {(['counter', 'guest', 'account'] as ChannelKey[]).map((c) => {
                    const ch = cur.byChannel[c]
                    return (
                      <MeterBar
                        key={c}
                        label={CHANNEL[c].label}
                        value={ch.revenue}
                        total={cur.totalRevenue}
                        accent={CHANNEL[c].accent}
                        valueText={`${money(ch.revenue)} · ${ch.count}`}
                      />
                    )
                  })}
                </div>
              )}
            </WidgetCard>
          </div>
        </section>

        {/* 02 · Márgenes por producto */}
        <section className="flex flex-col gap-3.5">
          <DashboardSectionHeader index="02" title="Márgenes por producto" description="Mes seleccionado" />
          <WidgetCard title="Márgenes por producto" className="col-span-12">
            {data.topMargin.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-[13px] text-ink-700 m-0">Aún no hay márgenes que mostrar.</p>
                <p className="text-[12.5px] text-ink-500 mt-1 mb-3">
                  El margen aparece cuando las ventas tienen un coste registrado.
                </p>
                <Link
                  href="/admin/stock"
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-clay-700 hover:text-accent-hover"
                >
                  Registrar entradas de stock <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-sand-300 text-[11px] tracking-[0.1em] uppercase text-ink-500">
                        <th className="text-left font-semibold py-2 pr-3">Producto</th>
                        <th className="text-right font-semibold py-2 px-3">Uds</th>
                        <th className="text-right font-semibold py-2 px-3">Ingresos</th>
                        <th className="text-right font-semibold py-2 px-3">Coste</th>
                        <th className="text-right font-semibold py-2 pl-3">Margen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topMargin.map((p) => {
                        const neg = (p.marginPct ?? 0) < 0
                        return (
                          <tr key={p.productId ?? p.name} className="border-b border-sand-200 last:border-b-0">
                            <td className="py-2.5 pr-3 text-ink-900 truncate max-w-[280px]">{p.name}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-ink-700 tabular-nums">{int(p.units)}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-ink-900 tabular-nums">{money(p.revenue)}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-ink-500 tabular-nums">{money(p.cogs)}</td>
                            <td className={`py-2.5 pl-3 text-right font-mono tabular-nums ${neg ? 'text-brick-600' : 'text-olive-600'}`}>
                              {p.marginPct === null ? '—' : pct(p.marginPct)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {data.lowMargin.length > 0 && (
                  <div className="border-t border-sand-200 pt-3 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="text-ink-500 uppercase tracking-[0.1em] text-[10.5px] font-semibold">Menor margen</span>
                    {data.lowMargin.slice(0, 3).map((p) => (
                      <span key={p.productId ?? p.name} className="inline-flex items-center gap-1.5 bg-sand-100 border border-sand-300 rounded-full px-2.5 py-0.5">
                        <span className="text-ink-700 truncate max-w-[160px]">{p.name}</span>
                        <span className={`font-mono ${(p.marginPct ?? 0) < 0 ? 'text-brick-600' : 'text-ink-500'}`}>
                          {p.marginPct === null ? '—' : pct(p.marginPct)}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </WidgetCard>
        </section>

        {/* 03 · Inventario y compras */}
        <section className="flex flex-col gap-3.5">
          <DashboardSectionHeader index="03" title="Inventario y compras" description="Base del registro 606 DGII" />
          <div className="grid grid-cols-12 gap-3 lg:gap-4">
            <WidgetCard title="Inventario valorizado" subtitle="Snapshot actual" className="col-span-12 lg:col-span-5">
              <div className="grid grid-cols-3 gap-2.5">
                <MiniStat label="Al coste" value={money(inv.costValue)} sub="DOP" />
                <MiniStat label="A precio venta" value={money(inv.retailValue)} sub="DOP" />
                <MiniStat label="Unidades" value={int(inv.units)} />
              </div>
              <MeterBar
                label="Productos con coste registrado"
                value={inv.productsWithCost}
                total={inv.productsActive}
                accent="clay"
                valueText={`${inv.productsWithCost}/${inv.productsActive}`}
              />
            </WidgetCard>

            <WidgetCard
              title="Compras del mes"
              subtitle="Entradas de stock — base 606"
              link={{ href: '/admin/stock', label: 'Entradas →' }}
              className="col-span-12 lg:col-span-7"
            >
              {pur.entries === 0 ? (
                <p className="text-[12.5px] text-ink-500 py-2">Sin compras registradas este mes.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <MiniStat label="Total comprado" value={money(pur.total)} sub="ITBIS incl." />
                    <MiniStat label="Base imponible" value={money(pur.taxBase)} sub="DOP" />
                    <MiniStat label="ITBIS estimado" value={money(pur.itbis)} sub="DOP" />
                    <MiniStat label="Entradas" value={int(pur.entries)} sub={`${int(pur.units)} uds`} />
                  </div>

                  {pur.withoutNcf > 0 && (
                    <div className="flex items-center gap-2 text-[12px] text-[#7A5A1C] bg-[rgba(181,133,43,0.12)] border border-[rgba(181,133,43,0.3)] rounded-md px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {pur.withoutNcf} entrada(s) sin NCF — complétalas para el registro 606.
                    </div>
                  )}

                  {pur.topSuppliers.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-[10.5px] uppercase tracking-[0.1em] text-ink-500 font-semibold">Proveedores</span>
                      {pur.topSuppliers.map((s) => (
                        <div key={s.name} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                          <span className="text-ink-700 truncate">{s.name}</span>
                          <span className="font-mono text-ink-900 tabular-nums">{money(s.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </WidgetCard>
          </div>
        </section>
      </div>
    </>
  )
}
