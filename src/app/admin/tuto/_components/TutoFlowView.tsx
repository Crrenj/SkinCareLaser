'use client'

import { MoveRight } from 'lucide-react'
import type { TutoFlow, TutoFlowTone } from '../_content/types'
import { Hl } from './tutoSearch'

/**
 * Diagramme de flux : chaînes (lanes) de nœuds numérotés reliés par des
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
    <div className="rounded-[10px] border border-sand-300 bg-sand-50 px-[18px] pb-2 pt-4">
      <p className="mb-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        <Hl t={flow.title} />
      </p>
      <div className="flex flex-col">
        {flow.lanes.map((lane, i) => (
          <div
            key={i}
            className={`flex flex-wrap items-start gap-x-[7px] gap-y-3 py-[11px] ${
              i > 0 ? 'border-t border-dashed border-sand-300' : ''
            }`}
          >
            {lane.map((node, j) => (
              <div key={j} className="flex items-start gap-2">
                {j > 0 && (
                  <MoveRight aria-hidden className="mt-1 h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.6} />
                )}
                <div className="flex max-w-[225px] flex-col gap-1.5">
                  <span
                    className={`inline-flex w-fit items-center gap-[7px] rounded-full border py-[3px] pl-1 pr-3 text-[12.5px] font-semibold leading-[1.3] ${
                      TONE_CLS[node.tone ?? 'neutral']
                    }`}
                  >
                    <span
                      aria-hidden
                      className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-ink-900/15 bg-sand-50/80 font-mono text-[9.5px] font-semibold"
                    >
                      {j + 1}
                    </span>
                    <Hl t={node.label} />
                  </span>
                  {node.note && (
                    <span className="pl-px text-[11.5px] leading-[1.5] text-ink-500">
                      <Hl t={node.note} />
                    </span>
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
