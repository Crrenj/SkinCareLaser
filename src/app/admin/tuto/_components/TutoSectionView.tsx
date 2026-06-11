import Link from 'next/link'
import { ArrowUpRight, CornerDownLeft, Ban, AlertTriangle } from 'lucide-react'
import type { TutoAction, TutoSection, TutoSeverity } from '../_content/types'
import { TutoMockupView } from './TutoMockupView'
import { TutoFlowView } from './TutoFlowView'

/** Libellés de chrome (i18n `Admin.tuto`) passés depuis la page serveur. */
export type TutoChromeLabels = {
  openScreen: string
  legend: string
  workflowsHeading: string
  actionsHeading: string
  gotchasHeading: string
  severity: Record<TutoSeverity, string>
  undoLabel: string
  noUndo: string
  audited: string
  publicSite: string
  accounting: string
}

const SEVERITY_CLS: Record<TutoSeverity, { chip: string; dot: string }> = {
  safe: { chip: 'bg-olive-50 border-olive-200 text-olive-800', dot: 'bg-olive-600' },
  caution: { chip: 'bg-ochre-200/40 border-ochre-200 text-ink-800', dot: 'bg-ochre-600' },
  danger: { chip: 'bg-brick-50 border-brick-200 text-brick-700', dot: 'bg-brick-600' },
}

function SeverityChip({ severity, labels }: { severity: TutoSeverity; labels: TutoChromeLabels }) {
  const cls = SEVERITY_CLS[severity]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${cls.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cls.dot}`} />
      {labels.severity[severity]}
    </span>
  )
}

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded border border-sand-400 bg-sand-100 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-700">
      {children}
    </span>
  )
}

function ActionRow({ action, labels }: { action: TutoAction; labels: TutoChromeLabels }) {
  return (
    <li className="border-b border-sand-200 px-4 py-3.5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityChip severity={action.severity} labels={labels} />
        <b className="text-[14px] font-semibold text-ink-900">{action.label}</b>
        <span className="ml-auto flex flex-wrap gap-1.5">
          {action.audited && <MetaBadge>{labels.audited}</MetaBadge>}
          {action.publicImpact && <MetaBadge>{labels.publicSite}</MetaBadge>}
          {action.accountingImpact && <MetaBadge>{labels.accounting}</MetaBadge>}
        </span>
      </div>
      <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-500">
        {action.where}
      </p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-800">{action.does}</p>
      {action.effects.length > 0 && (
        <ul className="mt-1.5 grid gap-1">
          {action.effects.map((e, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-ink-700">
              <span aria-hidden className="mt-px font-mono text-[12px] text-clay-700">
                →
              </span>
              {e}
            </li>
          ))}
        </ul>
      )}
      {(action.publicImpact || action.accountingImpact) && (
        <div className="mt-2 grid gap-1">
          {action.publicImpact && (
            <p className="flex items-start gap-2 text-[12.5px] leading-snug text-ink-700">
              <MetaBadge>{labels.publicSite}</MetaBadge>
              {action.publicImpact}
            </p>
          )}
          {action.accountingImpact && (
            <p className="flex items-start gap-2 text-[12.5px] leading-snug text-ink-700">
              <MetaBadge>{labels.accounting}</MetaBadge>
              {action.accountingImpact}
            </p>
          )}
        </div>
      )}
      {action.undo ? (
        <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-snug text-olive-800">
          <CornerDownLeft className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
          <span>
            <b className="font-semibold">{labels.undoLabel}</b> {action.undo}
          </span>
        </p>
      ) : action.severity === 'danger' ? (
        <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-brick-700">
          <Ban className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
          {labels.noUndo}
        </p>
      ) : null}
    </li>
  )
}

export function TutoSectionView({
  section,
  index,
  labels,
}: {
  section: TutoSection
  index: number
  labels: TutoChromeLabels
}) {
  return (
    <section id={section.id} className="scroll-mt-6">
      <div className="rounded-md border border-sand-300 bg-sand-50 overflow-hidden">
        {/* En-tête de section */}
        <div className="border-b border-sand-300 bg-sand-100/60 px-5 py-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-[12px] font-semibold tracking-[0.12em] text-clay-700">
              {String(index).padStart(2, '0')}
            </span>
            <h2 className="font-serif text-[26px] leading-tight text-ink-900">{section.title}</h2>
            {section.route && (
              <Link
                href={section.route}
                className="ml-auto inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] text-clay-700 hover:text-clay-800 transition-colors"
              >
                {labels.openScreen}
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
              </Link>
            )}
          </div>
          <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-ink-700">
            {section.intro}
          </p>
        </div>

        <div className="grid gap-6 px-5 py-5">
          {section.mockup && (
            <TutoMockupView
              mockup={section.mockup}
              hotspots={section.hotspots}
              legendLabel={labels.legend}
            />
          )}

          {section.flows?.map((flow, i) => <TutoFlowView key={i} flow={flow} />)}

          {section.workflows && section.workflows.length > 0 && (
            <div>
              <h3 className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {labels.workflowsHeading}
              </h3>
              <div className="grid gap-3 lg:grid-cols-2">
                {section.workflows.map((wf, i) => (
                  <div key={i} className="rounded-md border border-sand-300 bg-sand-100/50 p-4">
                    <p className="mb-3 text-[14px] font-semibold text-ink-900">{wf.title}</p>
                    <ol className="grid gap-2.5">
                      {wf.steps.map((step, j) => (
                        <li key={j} className="flex items-start gap-2.5">
                          <span className="mt-px shrink-0 font-mono text-[11px] font-semibold text-clay-700">
                            {String(j + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[13px] leading-snug text-ink-700">
                            <b className="font-semibold text-ink-900">{step.title}.</b> {step.body}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.actions.length > 0 && (
            <div>
              <h3 className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {labels.actionsHeading}
              </h3>
              <ul className="rounded-md border border-sand-300 bg-sand-50">
                {section.actions.map((a, i) => (
                  <ActionRow key={i} action={a} labels={labels} />
                ))}
              </ul>
            </div>
          )}

          {section.gotchas && section.gotchas.length > 0 && (
            <div className="rounded-md border border-ochre-200 bg-ochre-200/25 p-4">
              <h3 className="mb-2.5 flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-700">
                <AlertTriangle className="h-3.5 w-3.5 text-ochre-600" strokeWidth={1.8} />
                {labels.gotchasHeading}
              </h3>
              <ul className="grid gap-2">
                {section.gotchas.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-ink-800">
                    <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ochre-600" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
