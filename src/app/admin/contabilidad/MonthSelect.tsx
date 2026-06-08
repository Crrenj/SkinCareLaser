'use client'

import { useRouter } from 'next/navigation'

type Props = {
  value: string
  options: { value: string; label: string }[]
}

/** Sélecteur de mois — navigue vers /admin/contabilidad?month=YYYY-MM (SSR). */
export function MonthSelect({ value, options }: Props) {
  const router = useRouter()
  return (
    <label className="inline-flex items-center gap-2">
      <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-500">Período</span>
      <select
        value={value}
        onChange={(e) => router.push(`/admin/contabilidad?month=${e.target.value}`)}
        aria-label="Período contable"
        className="px-3 py-2 text-[13px] text-ink-900 bg-sand-50 border border-sand-300 rounded-md capitalize focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-2 focus-visible:ring-clay-700/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="capitalize">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
