import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/formatPrice'

export type DailyPoint = {
  /** ISO date (YYYY-MM-DD) */
  date: string
  /** Total réservé brut sur la journée (toutes status sauf cancelled). */
  reserved: number
  /** Total confirmé/livré sur la journée (status confirmed|collected). */
  confirmed: number
}

type RevenueWidgetProps = {
  /** 7 points (lundi → dimanche) pour la semaine en cours. */
  current: DailyPoint[]
  /** 7 points pour la semaine précédente (utilisés pour calculer le trend). */
  previous: DailyPoint[]
}

const fmtDOP = (n: number) => formatPrice(Math.round(n), { fractionDigits: 0 })

const sum = (rows: DailyPoint[], key: 'reserved' | 'confirmed') =>
  rows.reduce((acc, r) => acc + (r[key] ?? 0), 0)

function trend(current: number, previous: number) {
  if (previous <= 0) return { pct: current > 0 ? 100 : 0, direction: 'flat' as const }
  const ratio = (current - previous) / previous
  return {
    pct: Math.round(Math.abs(ratio) * 1000) / 10,
    direction: ratio > 0.005 ? ('up' as const) : ratio < -0.005 ? ('down' as const) : ('flat' as const),
  }
}

export function RevenueWidget({ current, previous }: RevenueWidgetProps) {
  const reservedNow = sum(current, 'reserved')
  const confirmedNow = sum(current, 'confirmed')
  const reservedTrend = trend(reservedNow, sum(previous, 'reserved'))
  const confirmedTrend = trend(confirmedNow, sum(previous, 'confirmed'))
  const conversion = reservedNow > 0 ? (confirmedNow / reservedNow) * 100 : 0

  return (
    <article className="bg-sand-50 border border-sand-300 rounded-xl p-5 lg:p-6 flex flex-col gap-4 col-span-12 lg:col-span-8">
      <div className="flex justify-between items-baseline">
        <div>
          <h3 className="font-serif text-[20px] text-ink-900 m-0 mb-0.5">Reservas</h3>
          <small className="text-[11.5px] text-ink-500">Últimos 7 días · vs semana anterior</small>
        </div>
        <Link
          href="/admin/reservations"
          className="text-[11.5px] tracking-[0.06em] text-ink-700 hover:text-ink-900 border-b border-transparent hover:border-current transition-colors"
        >
          Ver detalle →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
        <Stat
          label="Reservado"
          dot="bg-clay-700"
          value={reservedNow}
          trendText={
            reservedTrend.direction === 'flat'
              ? '= vs semana anterior'
              : `${reservedTrend.direction === 'up' ? '+' : '-'}${reservedTrend.pct.toString().replace('.', ',')} % vs semana anterior`
          }
          trendDir={reservedTrend.direction}
          border
        />
        <Stat
          label="Confirmado"
          dot="bg-olive-600"
          value={confirmedNow}
          trendText={`${
            confirmedTrend.direction === 'flat'
              ? '='
              : `${confirmedTrend.direction === 'up' ? '+' : '-'}${confirmedTrend.pct.toString().replace('.', ',')} %`
          } · tasa de conversión ${conversion.toFixed(1).replace('.', ',')} %`}
          trendDir={confirmedTrend.direction}
        />
      </div>

      <Sparkline current={current} />
    </article>
  )
}

function Stat({
  label,
  dot,
  value,
  trendText,
  trendDir,
  border,
}: {
  label: string
  dot: string
  value: number
  trendText: string
  trendDir: 'up' | 'down' | 'flat'
  border?: boolean
}) {
  const Icon = trendDir === 'up' ? ArrowUpRight : trendDir === 'down' ? ArrowDownRight : Minus
  const trendColor =
    trendDir === 'up' ? 'text-olive-600' : trendDir === 'down' ? 'text-brick-600' : 'text-ink-500'

  return (
    <div className={`flex flex-col gap-1.5 ${border ? 'sm:border-r sm:border-sand-300 sm:pr-6' : ''}`}>
      <span className="text-[11px] tracking-[0.14em] uppercase text-ink-500 font-semibold inline-flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden />
        {label}
      </span>
      <span className="font-serif text-[36px] lg:text-[44px] text-ink-900 leading-none tracking-[-0.01em] whitespace-nowrap">
        {fmtDOP(value)}
        <small className="font-sans text-[13px] lg:text-[14px] text-ink-500 font-medium ml-1.5">
          DOP
        </small>
      </span>
      <span className={`text-[12px] inline-flex items-center gap-1 mt-0.5 ${trendColor}`}>
        <Icon className="w-3 h-3" />
        {trendText}
      </span>
    </div>
  )
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function Sparkline({ current }: { current: DailyPoint[] }) {
  // Padding et dimensions internes du SVG
  const points = current.length
  if (points === 0) {
    return (
      <div className="mt-3 px-4 py-12 bg-sand-100 rounded-md text-center text-[12px] text-ink-500">
        Sin datos para este período
      </div>
    )
  }

  const maxRes = Math.max(1, ...current.map((p) => p.reserved))
  const maxConf = Math.max(1, ...current.map((p) => p.confirmed))
  const max = Math.max(maxRes, maxConf, 1)
  const w = 700
  const h = 130
  const padL = 24
  const padR = 24
  const padT = 12
  const padB = 22
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const step = points > 1 ? innerW / (points - 1) : 0

  const xy = (i: number, v: number) => ({
    x: padL + step * i,
    y: padT + innerH - (v / max) * innerH,
  })

  const reservedPath = current
    .map((p, i) => {
      const { x, y } = xy(i, p.reserved)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  const confirmedPath = current
    .map((p, i) => {
      const { x, y } = xy(i, p.confirmed)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  const reservedArea =
    reservedPath +
    ` L ${(padL + step * (points - 1)).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${padL.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`

  return (
    <div className="mt-4 px-3.5 pt-3.5 pb-1 bg-sand-100 rounded-lg flex flex-col gap-2">
      <div className="flex gap-4 text-[11.5px] text-ink-700">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-clay-700" aria-hidden />
          Reservas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-olive-600" aria-hidden />
          Confirmadas
        </span>
        <span className="ml-auto text-ink-500">Últimos 7 días</span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ height: 130 }}
        className="block w-full"
        role="img"
        aria-label="Sparkline reservas vs confirmadas sur 7 jours"
      >
        {/* Grid */}
        <g stroke="var(--color-sand-300)" strokeWidth="0.5" strokeDasharray="2 4">
          <line x1="0" y1={padT + innerH / 4} x2={w} y2={padT + innerH / 4} />
          <line x1="0" y1={padT + innerH / 2} x2={w} y2={padT + innerH / 2} />
          <line x1="0" y1={padT + (3 * innerH) / 4} x2={w} y2={padT + (3 * innerH) / 4} />
        </g>
        {/* Reserved area */}
        <path d={reservedArea} fill="var(--color-clay-700)" opacity="0.10" />
        {/* Reserved line */}
        <path
          d={reservedPath}
          fill="none"
          stroke="var(--color-clay-700)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Confirmed line */}
        <path
          d={confirmedPath}
          fill="none"
          stroke="var(--color-olive-600)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        <g fill="var(--color-clay-700)">
          {current.map((p, i) => {
            const { x, y } = xy(i, p.reserved)
            const r = i === points - 1 ? 4 : 3
            return <circle key={`r${i}`} cx={x} cy={y} r={r} />
          })}
        </g>
        <g fill="var(--color-olive-600)">
          {current.map((p, i) => {
            const { x, y } = xy(i, p.confirmed)
            const r = i === points - 1 ? 4 : 3
            return <circle key={`c${i}`} cx={x} cy={y} r={r} />
          })}
        </g>
        {/* Day labels */}
        <g fill="var(--color-ink-500)" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
          {current.map((_, i) => (
            <text key={`d${i}`} x={padL + step * i} y={h - 4}>
              {DAY_LABELS[i] ?? ''}
            </text>
          ))}
        </g>
      </svg>
    </div>
  )
}
