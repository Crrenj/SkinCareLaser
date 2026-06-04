import { WidgetCard } from './WidgetCard'
import { MeterBar } from './MeterBar'

export type CoverageMetric = { label: string; covered: number; total: number }

export type CatalogueReadiness = {
  /** Score global 0–100 (moyenne des taux de complétude). */
  score: number
  activeProducts: number
  brands: number
  ranges: number
  featured: number
  isNew: number
  promo: number
  metrics: CoverageMetric[]
}

type Accent = 'clay' | 'olive' | 'brick' | 'ochre'

function accentFor(pct: number): Accent {
  if (pct >= 80) return 'olive'
  if (pct >= 40) return 'clay'
  if (pct >= 15) return 'ochre'
  return 'brick'
}

function Chip({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 bg-sand-100 border border-sand-200 rounded-full px-2.5 py-1 text-[11px] text-ink-700">
      <b className="font-mono text-ink-900 tabular-nums">{n}</b>
      {label}
    </span>
  )
}

/**
 * Complétude des fiches produit — le signal le plus actionnable avant
 * lancement : image, prix, INCI, bénéfices, conseil, etc. Le score moyen
 * dit en un coup d'œil « combien de travail éditorial reste ».
 */
export function CatalogueReadinessWidget({
  data,
  className,
}: {
  data: CatalogueReadiness
  className?: string
}) {
  const scoreAccent = accentFor(data.score)
  const scoreColor =
    scoreAccent === 'olive'
      ? 'text-olive-600'
      : scoreAccent === 'clay'
        ? 'text-clay-700'
        : scoreAccent === 'ochre'
          ? 'text-ochre-600'
          : 'text-brick-600'

  return (
    <WidgetCard
      title="Preparación del catálogo"
      subtitle={`${data.activeProducts} productos · ${data.brands} marcas · ${data.ranges} gamas`}
      link={{ href: '/admin/product', label: 'Ver productos →' }}
      gap="gap-4"
      className={className}
    >
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-end gap-3">
          <span className={`font-serif text-[46px] lg:text-[54px] leading-[0.85] ${scoreColor}`}>
            {data.score}
            <small className="font-sans text-[16px] text-ink-500 font-medium">%</small>
          </span>
          <span className="text-[11.5px] text-ink-500 leading-[1.4] pb-1 max-w-[140px]">
            Completitud media de las fichas
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip n={data.featured} label="destacados" />
          <Chip n={data.isNew} label="novedades" />
          <Chip n={data.promo} label="en promo" />
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-1">
        {data.metrics.map((m) => {
          const pct = m.total > 0 ? Math.round((m.covered / m.total) * 100) : 0
          return (
            <MeterBar
              key={m.label}
              label={m.label}
              value={m.covered}
              total={m.total}
              accent={accentFor(pct)}
              valueText={`${pct}% · ${m.covered}/${m.total}`}
            />
          )
        })}
      </div>
    </WidgetCard>
  )
}
