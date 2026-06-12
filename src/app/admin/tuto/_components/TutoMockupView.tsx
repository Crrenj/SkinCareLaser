'use client'

import { useContext, useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import type { TutoBlockKind, TutoHotspot, TutoMockup } from '../_content/types'
import { TutoQueryCtx, deburr, Hl } from './tutoSearch'

/**
 * Schéma d'écran interactif : maquette dans un faux cadre navigateur (la
 * disposition des blocs reproduit la vraie page) + légende synchronisée —
 * cliquer une pastille (sur le schéma ou dans la légende) ouvre son
 * explication au lieu de tout empiler.
 */

const KIND_CLS: Record<TutoBlockKind, string> = {
  kpi: 'h-[42px] bg-sand-50 border border-sand-300',
  toolbar: 'h-8 bg-sand-300/50 border border-sand-300',
  tabs: 'h-8 bg-sand-50 border border-sand-300 rounded-full',
  table: 'h-[86px] bg-sand-50 border border-sand-300 justify-start px-2 py-2 gap-1.5',
  button: 'h-8 bg-clay-700',
  panel: 'h-[62px] bg-sand-50 border border-sand-300',
  input: 'h-8 bg-sand-50 border border-sand-400 rounded-[5px] shadow-[inset_0_1px_2px_rgba(31,27,22,0.05)]',
  text: 'h-8 gap-1',
  drawer: 'h-[98px] bg-sand-50 border border-sand-300 border-l-[3px] border-l-clay-700 justify-start px-2 py-2 gap-1.5',
}

function Skel({ w, strong }: { w: string; strong?: boolean }) {
  return (
    <span
      aria-hidden
      className={`h-[5px] shrink-0 rounded-[3px] ${strong ? 'bg-sand-300' : 'bg-sand-200'}`}
      style={{ width: w }}
    />
  )
}

function HotspotBadge({ n, active }: { n: number; active?: boolean }) {
  return (
    <span
      className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold leading-none text-sand-50 ${
        active ? 'bg-ink-900' : 'bg-clay-700'
      }`}
    >
      {n}
    </span>
  )
}

function BlockLabel({ label, left }: { label?: string; left?: boolean }) {
  if (!label) return null
  return (
    <span
      className={`font-mono text-[9px] uppercase tracking-[0.06em] leading-[1.3] text-ink-500 ${
        left ? 'text-left' : 'truncate px-1.5 text-center'
      }`}
    >
      {label}
    </span>
  )
}

function MockupBlock({
  b,
  active,
  onActivate,
  descIdFor,
}: {
  b: { w: number; kind: TutoBlockKind; label?: string; hotspot?: number }
  active: number | null
  onActivate: (n: number) => void
  descIdFor: (n: number) => string
}) {
  const hot = b.hotspot !== undefined
  const isActive = hot && active === b.hotspot
  const inner =
    b.kind === 'table' || b.kind === 'drawer' ? (
      <>
        <BlockLabel label={b.label} left />
        <Skel w="88%" />
        <Skel w="78%" />
        <Skel w="52%" />
      </>
    ) : b.kind === 'text' ? (
      <>
        <BlockLabel label={b.label} left />
        <Skel w={b.label ? '52%' : '88%'} strong />
        {!b.label && <Skel w="60%" strong />}
      </>
    ) : b.kind === 'button' ? (
      <span className="truncate px-1.5 text-center font-mono text-[9px] uppercase tracking-[0.06em] leading-[1.3] text-on-accent">
        {b.label}
      </span>
    ) : (
      <BlockLabel label={b.label} />
    )

  return (
    <div
      className={`relative flex min-w-0 flex-col justify-center rounded-md ${KIND_CLS[b.kind]} ${
        hot
          ? 'cursor-pointer hover:border-ink-500 focus-visible:ring-2 focus-visible:ring-clay-700 focus-visible:ring-offset-2'
          : ''
      } ${isActive ? 'outline outline-2 outline-offset-2 outline-ink-900' : ''}`}
      style={{ flexGrow: b.w, flexBasis: 0 }}
      role={hot ? 'button' : undefined}
      tabIndex={hot ? 0 : undefined}
      aria-expanded={hot ? isActive : undefined}
      aria-controls={isActive ? descIdFor(b.hotspot as number) : undefined}
      onClick={hot ? () => onActivate(b.hotspot as number) : undefined}
      onKeyDown={
        hot
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onActivate(b.hotspot as number)
              }
            }
          : undefined
      }
    >
      {inner}
      {hot && (
        <span className="absolute -right-[7px] -top-2 z-[2] rounded-full shadow-[0_0_0_2px_var(--color-sand-200)]">
          <HotspotBadge n={b.hotspot as number} active={isActive} />
        </span>
      )}
    </div>
  )
}

export function TutoMockupView({
  mockup,
  hotspots,
  route,
}: {
  mockup: TutoMockup
  hotspots?: TutoHotspot[]
  route?: string
}) {
  const t = useTranslations('Admin.tuto')
  const q = useContext(TutoQueryCtx)
  const dq = q ? deburr(q) : ''
  const [active, setActive] = useState<number | null>(hotspots?.length ? hotspots[0].n : null)
  const uid = useId()
  const descIdFor = (n: number) => `${uid}-hs-${n}`

  return (
    <div>
      <h3 className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        {t('schemaHeading')}
      </h3>
      <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
        {/* Faux cadre navigateur */}
        <div className="overflow-hidden rounded-[10px] border border-sand-300 bg-sand-200">
          <div className="flex items-center gap-[5px] border-b border-sand-300 bg-sand-100 px-2.5 py-[7px]">
            <span aria-hidden className="h-2 w-2 rounded-full bg-sand-400" />
            <span aria-hidden className="h-2 w-2 rounded-full bg-sand-400" />
            <span aria-hidden className="h-2 w-2 rounded-full bg-sand-400" />
            <span className="ml-2 rounded border border-sand-300 bg-sand-50 px-2 py-px font-mono text-[10px] leading-[1.6] text-ink-500">
              {`farmau.do${route || '/admin'}`}
            </span>
          </div>
          <div className="flex flex-col gap-2 p-3">
            {mockup.rows.map((row, i) => (
              <div key={i} className="flex gap-2">
                {row.blocks.map((b, j) => (
                  <MockupBlock key={j} b={b} active={active} onActivate={setActive} descIdFor={descIdFor} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Légende synchronisée */}
        {hotspots && hotspots.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              {t('legend')}
            </p>
            <ul className="flex flex-col gap-px">
              {hotspots.map((h) => {
                const isOn = active === h.n
                const isOpen = isOn || (!!dq && deburr(`${h.label} ${h.desc}`).includes(dq))
                return (
                  <li key={h.n}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-[13px] leading-[1.35] text-ink-800 hover:bg-sand-200 ${
                        isOn ? 'bg-sand-200' : ''
                      }`}
                      aria-expanded={isOpen}
                      aria-controls={isOpen ? descIdFor(h.n) : undefined}
                      onClick={() => setActive(isOn ? null : h.n)}
                    >
                      <HotspotBadge n={h.n} active={isOn} />
                      <span className={`min-w-0 ${isOn ? 'font-semibold text-ink-900' : ''}`}>
                        <Hl t={h.label} />
                      </span>
                      <ChevronDown
                        className={`ml-auto h-[13px] w-[13px] shrink-0 text-ink-400 transition-transform ${
                          isOn ? 'rotate-180' : ''
                        }`}
                        strokeWidth={2}
                      />
                    </button>
                    {isOpen && (
                      <p id={descIdFor(h.n)} className="mb-2.5 ml-[37px] mr-2 mt-1 text-[12.5px] leading-[1.58] text-ink-700">
                        <Hl t={h.desc} />
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
