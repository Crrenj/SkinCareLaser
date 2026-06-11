import { MoveRight } from 'lucide-react'
import type { TutoFlow, TutoFlowTone } from '../_content/types'

/**
 * Diagramme de flux : une ou plusieurs chaînes de nœuds reliés par des
 * flèches, avec une note courte sous chaque nœud. Sert aux machines à états
 * (cycle d'une réservation, vie d'un prix, vie d'un coût…).
 */

const TONE_CLS: Record<TutoFlowTone, string> = {
  neutral: 'bg-sand-50 border-sand-400 text-ink-800',
  ok: 'bg-olive-50 border-olive-200 text-olive-800',
  warn: 'bg-ochre-200/40 border-ochre-200 text-ink-800',
  bad: 'bg-brick-50 border-brick-200 text-brick-700',
}

export function TutoFlowView({ flow }: { flow: TutoFlow }) {
  return (
    <div className="rounded-md border border-sand-300 bg-sand-50 p-4">
      <p className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        {flow.title}
      </p>
      <div className="flex flex-col gap-4">
        {flow.lanes.map((lane, i) => (
          <div key={i} className="flex flex-wrap items-start gap-x-2 gap-y-3">
            {lane.map((node, j) => (
              <div key={j} className="flex items-start gap-2">
                {j > 0 && (
                  <MoveRight className="mt-1.5 h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.6} />
                )}
                <div className="flex max-w-[210px] flex-col gap-1">
                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold leading-none ${
                      TONE_CLS[node.tone ?? 'neutral']
                    }`}
                  >
                    {node.label}
                  </span>
                  {node.note && (
                    <span className="text-[11.5px] leading-snug text-ink-500">{node.note}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
