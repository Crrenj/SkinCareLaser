'use client'

import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AlertTriangle, ArrowUpRight, Ban, ChevronDown, CornerDownLeft } from 'lucide-react'
import type { TutoAction, TutoSection, TutoSeverity } from '../_content/types'
import { TutoMockupView } from './TutoMockupView'
import { TutoFlowView } from './TutoFlowView'
import { TutoQueryCtx, actionSearchText, deburr, Hl } from './tutoSearch'

/**
 * Carte de section : résumé synthétique toujours visible (une phrase +
 * compteurs), détail complet au dépliage — schéma interactif, flux, modes
 * opératoires, actions en accordéon, pièges.
 */

const SEVERITY_CLS: Record<TutoSeverity, { chip: string; dot: string }> = {
  safe: { chip: 'bg-olive-50 border-olive-200 text-olive-800', dot: 'bg-olive-600' },
  caution: { chip: 'bg-ochre-200/40 border-ochre-200 text-ink-800', dot: 'bg-ochre-600' },
  danger: { chip: 'bg-brick-50 border-brick-200 text-brick-700', dot: 'bg-brick-600' },
}

function SeverityChip({ severity }: { severity: TutoSeverity }) {
  const t = useTranslations('Admin.tuto')
  const label = { safe: t('severitySafe'), caution: t('severityCaution'), danger: t('severityDanger') }[severity]
  const cls = SEVERITY_CLS[severity]
  return (
    <span
      className={`inline-flex w-[96px] shrink-0 items-center gap-1.5 rounded-full border py-0.5 pl-2 text-[9.5px] font-semibold uppercase tracking-[0.07em] ${cls.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cls.dot}`} />
      {label}
    </span>
  )
}

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded border border-sand-400 bg-sand-100 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-700">
      {children}
    </span>
  )
}

function ActionItem({ action, searching }: { action: TutoAction; searching: boolean }) {
  const t = useTranslations('Admin.tuto')
  const q = useContext(TutoQueryCtx)
  // null = suit la recherche (auto-ouvert si l'action matche), sinon choix explicite
  const [open, setOpen] = useState<boolean | null>(null)
  const matches = searching && q ? deburr(actionSearchText(action)).includes(deburr(q)) : false
  const isOpen = open ?? matches

  // Nouvelle requête (ou recherche effacée) → on repart de l'état automatique
  useEffect(() => {
    setOpen(null)
  }, [q])

  return (
    <li className={isOpen ? 'bg-sand-100/40' : ''}>
      <button
        type="button"
        className={`flex w-full items-center gap-[11px] px-4 py-[11px] text-left hover:bg-sand-100 ${
          isOpen ? 'bg-sand-100' : ''
        }`}
        aria-expanded={isOpen}
        onClick={() => setOpen(!isOpen)}
      >
        <SeverityChip severity={action.severity} />
        <span className="min-w-0 text-[13.5px] font-semibold leading-[1.35] text-ink-900">
          <Hl t={action.label} />
        </span>
        <span className="ml-auto hidden shrink-0 gap-[5px] sm:flex">
          {action.audited && <MetaBadge>{t('auditedBadge')}</MetaBadge>}
          {action.publicImpact && <MetaBadge>{t('publicBadge')}</MetaBadge>}
          {action.accountingImpact && <MetaBadge>{t('accountingBadge')}</MetaBadge>}
        </span>
        <ChevronDown
          aria-hidden
          className={`h-[15px] w-[15px] shrink-0 text-ink-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>
      {isOpen && (
        <div className="px-[18px] pb-4 pt-1 sm:pl-[122px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">
            <Hl t={action.where} />
          </p>
          <p className="mt-[7px] max-w-[76ch] text-[13.5px] leading-[1.62] text-ink-800">
            <Hl t={action.does} />
          </p>
          {action.effects.length > 0 && (
            <ul className="mt-2 grid gap-[5px]">
              {action.effects.map((e, i) => (
                <li key={i} className="flex max-w-[76ch] items-start gap-2 text-[13px] leading-[1.52] text-ink-700">
                  <span aria-hidden className="shrink-0 font-mono text-[12px] text-clay-700">
                    →
                  </span>
                  <span>
                    <Hl t={e} />
                  </span>
                </li>
              ))}
            </ul>
          )}
          {action.publicImpact && (
            <p className="mt-2 flex max-w-[76ch] items-start gap-2 text-[12.5px] leading-[1.5] text-ink-700">
              <MetaBadge>{t('publicBadge')}</MetaBadge>
              <span>
                <Hl t={action.publicImpact} />
              </span>
            </p>
          )}
          {action.accountingImpact && (
            <p className="mt-2 flex max-w-[76ch] items-start gap-2 text-[12.5px] leading-[1.5] text-ink-700">
              <MetaBadge>{t('accountingBadge')}</MetaBadge>
              <span>
                <Hl t={action.accountingImpact} />
              </span>
            </p>
          )}
          {action.audited && (
            <p className="mt-2 sm:hidden">
              <MetaBadge>{t('auditedBadge')}</MetaBadge>
            </p>
          )}
          {action.undo ? (
            <p className="mt-[11px] flex max-w-[76ch] items-start gap-2 text-[12.5px] leading-[1.55] text-olive-800">
              <CornerDownLeft aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
              <span>
                <b className="font-semibold">{t('undoLabel')}</b> <Hl t={action.undo} />
              </span>
            </p>
          ) : action.severity === 'danger' ? (
            <p className="mt-[11px] flex items-center gap-[7px] text-[12.5px] font-semibold text-brick-700">
              <Ban aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
              {t('noUndo')}
            </p>
          ) : null}
        </div>
      )}
    </li>
  )
}

export function TutoSectionCard({
  section,
  summary,
  index,
  open,
  onToggle,
  searching,
}: {
  section: TutoSection
  summary: string
  index: number
  open: boolean
  onToggle: () => void
  searching: boolean
}) {
  const t = useTranslations('Admin.tuto')
  const dangers = section.actions.filter((a) => a.severity === 'danger').length
  const schemaCount = (section.mockup ? 1 : 0) + (section.flows?.length ?? 0)

  const meta: string[] = []
  if (schemaCount) meta.push(t('metaSchemas', { count: schemaCount }))
  if (section.workflows?.length) meta.push(t('metaWorkflows', { count: section.workflows.length }))
  if (section.actions.length) meta.push(t('metaActions', { count: section.actions.length }))
  if (section.gotchas?.length) meta.push(t('metaGotchas', { count: section.gotchas.length }))

  return (
    <section
      id={`sec-${section.id}`}
      className={`scroll-mt-[100px] overflow-hidden rounded-xl border border-sand-300 bg-sand-50 ${
        open ? 'shadow-[0_1px_2px_rgba(31,27,22,0.05),0_10px_28px_-14px_rgba(31,27,22,0.14)]' : ''
      }`}
    >
      {/* En-tête repliable : résumé toujours visible */}
      <div
        className="grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 px-[22px] py-[18px] text-left hover:bg-sand-100"
        onClick={() => {
          // ne pas replier la carte quand l'utilisateur sélectionne du texte pour le copier
          if (window.getSelection()?.toString()) return
          onToggle()
        }}
      >
        <span className="pt-2 font-mono text-[11px] font-semibold tracking-[0.1em] text-clay-700">
          {String(index).padStart(2, '0')}
        </span>
        <span className="min-w-0">
          <h2 className="font-serif text-[23px] font-normal leading-[1.18] text-ink-900">
            <Hl t={section.title} />
          </h2>
          <p className="mt-[7px] max-w-[72ch] text-[14px] leading-[1.55] text-ink-700">
            <Hl t={summary} />
          </p>
          <p className="mt-[11px] flex flex-wrap items-center gap-x-3.5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            {meta.map((m, i) => (
              <span key={i}>{m}</span>
            ))}
            {dangers > 0 && (
              <span className="font-semibold text-brick-700">{t('metaIrreversible', { count: dangers })}</span>
            )}
            {section.route && (
              <Link
                href={section.route}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-clay-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {t('openScreen')}
                <ArrowUpRight aria-hidden className="h-[11px] w-[11px]" strokeWidth={2} />
              </Link>
            )}
          </p>
        </span>
        <span className="flex flex-col items-center">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? `sec-body-${section.id}` : undefined}
            aria-label={section.title}
            className={`mt-[3px] grid h-[30px] w-[30px] place-items-center rounded-full border transition-transform ${
              open
                ? 'rotate-180 border-ink-900 bg-ink-900 text-sand-50'
                : 'border-sand-300 bg-sand-50 text-ink-500'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
          >
            <ChevronDown aria-hidden className="h-[15px] w-[15px]" strokeWidth={2} />
          </button>
          <span className="mt-[5px] text-center font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">
            {open ? t('hintClose') : t('hintOpen')}
          </span>
        </span>
      </div>

      {open && (
        <div id={`sec-body-${section.id}`} className="grid gap-[26px] border-t border-sand-200 p-[22px]">
          <p className="max-w-[78ch] text-[14px] leading-[1.65] text-ink-800">
            <Hl t={section.intro} />
          </p>

          {section.mockup && (
            <TutoMockupView mockup={section.mockup} hotspots={section.hotspots} route={section.route} />
          )}

          {section.flows?.map((flow, i) => <TutoFlowView key={i} flow={flow} />)}

          {section.workflows && section.workflows.length > 0 && (
            <div>
              <h3 className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {t('workflowsHeading')} <span className="tracking-normal text-ink-500">· {section.workflows.length}</span>
              </h3>
              <div className="grid gap-3 lg:grid-cols-2">
                {section.workflows.map((wf, i) => (
                  <div key={i} className="rounded-[10px] border border-sand-300 bg-sand-100/60 px-[17px] py-[15px]">
                    <p className="mb-[11px] text-[14px] font-semibold text-ink-900">
                      <Hl t={wf.title} />
                    </p>
                    <ol className="grid gap-[9px]">
                      {wf.steps.map((step, j) => (
                        <li key={j} className="flex gap-2.5 text-[13px] leading-[1.52] text-ink-700">
                          <span className="mt-0.5 shrink-0 font-mono text-[10.5px] font-semibold text-clay-700">
                            {String(j + 1).padStart(2, '0')}
                          </span>
                          <span>
                            <b className="font-semibold text-ink-900">
                              <Hl t={step.title} />.
                            </b>{' '}
                            <Hl t={step.body} />
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
                {t('actionsHeading')} <span className="tracking-normal text-ink-500">· {section.actions.length}</span>
              </h3>
              <ul className="divide-y divide-sand-200 overflow-hidden rounded-[10px] border border-sand-300 bg-sand-50">
                {section.actions.map((a, i) => (
                  <ActionItem key={i} action={a} searching={searching} />
                ))}
              </ul>
            </div>
          )}

          {section.gotchas && section.gotchas.length > 0 && (
            <div className="rounded-[10px] border border-ochre-200 bg-ochre-200/25 px-[17px] py-[15px]">
              <h3 className="mb-2.5 flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-700">
                <AlertTriangle aria-hidden className="h-[13px] w-[13px] text-ochre-600" strokeWidth={1.8} />
                {t('gotchasHeading')}
              </h3>
              <ul className="grid gap-[9px]">
                {section.gotchas.map((g, i) => (
                  <li key={i} className="flex max-w-[80ch] items-start gap-2.5 text-[13px] leading-[1.55] text-ink-800">
                    <span aria-hidden className="mt-2 h-[5px] w-[5px] shrink-0 rounded-full bg-ochre-600" />
                    <span>
                      <Hl t={g} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
