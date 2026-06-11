import type { TutoBlockKind, TutoHotspot, TutoMockup } from '../_content/types'

/**
 * Wireframe schématique d'un écran admin : lignes de blocs proportionnels
 * (grille 12) + pastilles numérotées reliées à une légende. Volontairement
 * abstrait (pas de capture d'écran à maintenir) mais fidèle à la disposition
 * réelle — même approche que le BannerTypeGuide du modal bannière.
 */

const KIND_CLS: Record<TutoBlockKind, string> = {
  kpi: 'h-10 bg-sand-50 border border-sand-300 rounded-md',
  toolbar: 'h-8 bg-sand-200/70 border border-sand-300 rounded-md',
  tabs: 'h-8 bg-sand-50 border border-sand-300 rounded-full',
  table: 'h-20 bg-sand-50 border border-sand-300 rounded-md overflow-hidden',
  button: 'h-8 bg-clay-700 rounded-md',
  panel: 'h-14 bg-sand-50 border border-sand-300 rounded-md',
  input: 'h-8 bg-sand-50 border border-sand-400 rounded-sm',
  text: 'h-8',
  drawer: 'h-24 bg-sand-50 border border-sand-300 border-l-[3px] border-l-clay-700 rounded-md',
}

function BlockInner({ kind, label }: { kind: TutoBlockKind; label?: string }) {
  if (kind === 'table') {
    return (
      <div className="flex h-full flex-col justify-center gap-1 px-2">
        {label && (
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500 truncate">
            {label}
          </span>
        )}
        <span className="h-1.5 rounded-sm bg-sand-200" />
        <span className="h-1.5 rounded-sm bg-sand-200" />
        <span className="h-1.5 w-3/4 rounded-sm bg-sand-200" />
      </div>
    )
  }
  if (kind === 'text') {
    return (
      <div className="flex h-full flex-col justify-center gap-1">
        <span className="h-1.5 rounded-sm bg-sand-300/80" />
        <span className="h-1.5 w-2/3 rounded-sm bg-sand-300/80" />
      </div>
    )
  }
  return (
    <span
      className={`flex h-full items-center justify-center px-1.5 text-center font-mono text-[9px] uppercase tracking-[0.08em] leading-tight truncate ${
        kind === 'button' ? 'text-on-accent' : 'text-ink-500'
      }`}
    >
      {label}
    </span>
  )
}

export function TutoMockupView({
  mockup,
  hotspots,
  legendLabel,
}: {
  mockup: TutoMockup
  hotspots?: TutoHotspot[]
  legendLabel: string
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <div className="rounded-md border border-sand-300 bg-sand-100 p-2.5 flex flex-col gap-2 self-start">
        {mockup.rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            {row.blocks.map((b, j) => (
              <div
                key={j}
                className={`relative min-w-0 ${KIND_CLS[b.kind]}`}
                style={{ flexGrow: b.w, flexBasis: 0 }}
              >
                <BlockInner kind={b.kind} label={b.label} />
                {b.hotspot !== undefined && (
                  <span className="absolute -top-2 -right-2 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-ink-900 font-mono text-[10px] font-semibold text-sand-50">
                    {b.hotspot}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {hotspots && hotspots.length > 0 && (
        <div className="self-start">
          <p className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            {legendLabel}
          </p>
          <ul className="grid gap-2">
            {hotspots.map((h) => (
              <li key={h.n} className="flex items-start gap-2.5 text-[13px] leading-snug">
                <span className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-ink-900 font-mono text-[10px] font-semibold text-sand-50">
                  {h.n}
                </span>
                <span className="text-ink-700">
                  <b className="font-semibold text-ink-900">{h.label}</b> — {h.desc}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
