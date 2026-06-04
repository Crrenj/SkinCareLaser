type MeterAccent = 'clay' | 'olive' | 'brick' | 'ochre' | 'ink'

const FILL: Record<MeterAccent, string> = {
  clay: 'bg-clay-700',
  olive: 'bg-olive-600',
  brick: 'bg-brick-600',
  ochre: 'bg-ochre-600',
  ink: 'bg-ink-500',
}

type MeterBarProps = {
  label: string
  /** Valeur couverte (numérateur). */
  value: number
  /** Total (dénominateur). */
  total: number
  accent?: MeterAccent
  /** Texte affiché à droite. Défaut : pourcentage + ratio. */
  valueText?: string
}

/**
 * Barre de progression libellée, alignée sur la typo admin (label ink-700,
 * ratio mono ink-500, piste sand-200). Réutilisée par les widgets de
 * complétude catalogue / inventaire / marques.
 */
export function MeterBar({ label, value, total, accent = 'clay', valueText }: MeterBarProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  // largeur min visible quand value>0 mais pct arrondi à 0
  const width = value > 0 ? Math.max(pct, 2) : 0

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-[12.5px] leading-none">
        <span className="text-ink-700 truncate">{label}</span>
        <span className="font-mono text-[11px] text-ink-500 whitespace-nowrap tabular-nums">
          {valueText ?? `${pct}%`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-sand-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${FILL[accent]} transition-[width]`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}
