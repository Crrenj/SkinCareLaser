import Link from 'next/link'

type Accent = 'clay' | 'olive' | 'brick' | 'ochre' | 'ink'

const ICON_BOX: Record<Accent, string> = {
  clay: 'bg-clay-700/10 text-clay-700',
  olive: 'bg-olive-600/12 text-olive-600',
  brick: 'bg-brick-600/10 text-brick-600',
  ochre: 'bg-ochre-600/14 text-ochre-600',
  ink: 'bg-ink-500/10 text-ink-700',
}

export type StatCardProps = {
  label: string
  value: string
  /** Suffixe discret (ex. "DOP", "uds"). */
  unit?: string
  /** Ligne secondaire sous la valeur. */
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  accent?: Accent
  href?: string
  /** Bordure d'alerte (qqch à traiter). */
  alert?: boolean
}

/**
 * Tuile KPI compacte pour la bande « pulse » en tête du dashboard.
 * Valeur en serif, label uppercase, pastille d'icône teintée. Cliquable
 * quand `href` est fourni.
 */
export function StatCard({
  label,
  value,
  unit,
  sub,
  icon: Icon,
  accent = 'ink',
  href,
  alert,
}: StatCardProps) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10.5px] tracking-[0.14em] uppercase text-ink-500 font-semibold leading-[1.45]">
          {label}
        </span>
        <span
          aria-hidden
          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center shrink-0 ${ICON_BOX[accent]}`}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
      </div>
      <div className="mt-auto">
        <span className="font-serif text-[30px] lg:text-[34px] leading-none tracking-[-0.01em] text-ink-900 whitespace-nowrap">
          {value}
          {unit && (
            <small className="font-sans text-[12px] text-ink-500 font-medium ml-1">{unit}</small>
          )}
        </span>
        {sub && <span className="block text-[11.5px] text-ink-500 mt-1.5 leading-[1.4]">{sub}</span>}
      </div>
    </>
  )

  const base = `bg-sand-50 border rounded-xl p-4 lg:p-[18px] flex flex-col gap-3 min-h-[120px] transition-colors ${
    alert ? 'border-brick-600/45' : 'border-sand-300'
  }`

  if (href) {
    return (
      <Link href={href} className={`${base} no-underline hover:border-clay-700/50 hover:bg-sand-100`}>
        {inner}
      </Link>
    )
  }
  return <div className={base}>{inner}</div>
}
