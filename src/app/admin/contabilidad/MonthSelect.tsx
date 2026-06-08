'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from 'lucide-react'

type Props = {
  value: string
  options: { value: string; label: string }[]
  /** Mois le plus récent sélectionnable (mois courant) — désactive « suivant ». */
  currentMonth: string
}

/** Décale un mois 'YYYY-MM' de `delta` mois (UTC). */
function shiftMonth(value: string, delta: number): string {
  const [y, m] = value.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/**
 * Sélecteur de mois proéminent (flèches préc./suiv. + menu déroulant). Navigue
 * vers /admin/contabilidad?month=YYYY-MM (SSR). Les flèches permettent d'aller
 * au-delà des 12 mois listés ; « suivant » est bloqué sur le mois courant.
 */
export function MonthSelect({ value, options, currentMonth }: Props) {
  const router = useRouter()
  const go = (m: string) => router.push(`/admin/contabilidad?month=${m}`)
  const atCurrent = value >= currentMonth

  const arrow =
    'w-9 h-9 inline-flex items-center justify-center rounded-md border border-sand-300 bg-sand-50 text-ink-700 hover:border-clay-700 hover:text-ink-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-sand-300 disabled:hover:text-ink-700'

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => go(shiftMonth(value, -1))}
        aria-label="Mes anterior"
        className={arrow}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="relative inline-flex items-center">
        <Calendar className="absolute left-2.5 w-3.5 h-3.5 text-ink-500 pointer-events-none" aria-hidden />
        <select
          value={value}
          onChange={(e) => go(e.target.value)}
          aria-label="Período contable"
          className="appearance-none pl-8 pr-8 h-9 min-w-[180px] text-[13.5px] font-medium text-ink-900 bg-sand-50 border border-sand-300 rounded-md capitalize cursor-pointer focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-2 focus-visible:ring-clay-700/20"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="capitalize">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-ink-500 pointer-events-none" aria-hidden />
      </div>

      <button
        type="button"
        onClick={() => go(shiftMonth(value, 1))}
        disabled={atCurrent}
        aria-label="Mes siguiente"
        className={arrow}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
