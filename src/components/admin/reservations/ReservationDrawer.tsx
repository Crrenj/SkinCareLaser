'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Loader2, X } from 'lucide-react'
import type { Reservation } from './types'
import {
  STATUS_BADGE_CLASS,
  STATUS_LABEL_ES,
  buildReservationRef,
  fmtDOP,
  nextStatusFor,
  nextStatusLabel,
  relativeAndAbsolute,
} from './types'

type ReservationDrawerProps = {
  reservation: Reservation
  onClose: () => void
  onWhatsapp: (r: Reservation) => void
  onAdvance: (r: Reservation) => Promise<void> | void
  onCancel: (r: Reservation) => Promise<void> | void
  onUpdateNote: (id: string, value: string) => Promise<void>
  busy?: boolean
}

export function ReservationDrawer({
  reservation,
  onClose,
  onWhatsapp,
  onAdvance,
  onCancel,
  onUpdateNote,
  busy = false,
}: ReservationDrawerProps) {
  const r = reservation
  const ref = buildReservationRef(r.id, r.created_at)
  const date = relativeAndAbsolute(r.created_at)
  const next = nextStatusFor(r.status)
  const nextLabel = nextStatusLabel(r.status)

  const [note, setNote] = useState(r.admin_notes ?? '')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noteSnapshot = useRef(r.admin_notes ?? '')

  useEffect(() => {
    setNote(r.admin_notes ?? '')
    noteSnapshot.current = r.admin_notes ?? ''
    setSaveState('idle')
  }, [r.id, r.admin_notes])

  // Autosave 800ms après la dernière frappe
  const handleNoteChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      setNote(value)
      setSaveState('saving')
      if (noteTimer.current) clearTimeout(noteTimer.current)
      noteTimer.current = setTimeout(async () => {
        if (value === noteSnapshot.current) {
          setSaveState('idle')
          return
        }
        try {
          await onUpdateNote(r.id, value)
          noteSnapshot.current = value
          setSaveState('saved')
        } catch {
          setSaveState('idle')
        }
      }, 800)
    },
    [onUpdateNote, r.id],
  )

  // Esc ferme le drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div
        className="lg:hidden fixed inset-0 z-30 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-drawer-title"
        className="fixed lg:absolute top-0 right-0 bottom-0 z-40 w-full sm:w-[520px] bg-sand-50 border-l border-sand-300 shadow-[-12px_0_32px_-8px_rgba(31,27,22,0.18)] flex flex-col"
      >
        <header className="px-6 pt-5 pb-4 border-b border-sand-300 flex justify-between items-start gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <h3
              id="reservation-drawer-title"
              className="font-serif text-[22px] lg:text-[24px] text-ink-900 m-0"
            >
              {r.contact_name || 'Sin nombre'}
            </h3>
            <span className="font-mono text-[11.5px] text-ink-500">
              {ref} · {date.abs}
            </span>
            <span
              className={`self-start inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                STATUS_BADGE_CLASS[r.status]
              }`}
            >
              {STATUS_LABEL_ES[r.status]}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-md text-ink-700 hover:bg-sand-200 hover:text-ink-900 transition-colors flex items-center justify-center"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <Section title="Cliente">
            <Block>
              <strong className="text-ink-900 font-semibold block mb-1">
                {r.contact_name || 'Sin nombre'}
              </strong>
              <a
                href={`tel:${r.contact_phone}`}
                className="text-clay-700 font-medium inline-flex items-center gap-1.5 no-underline"
              >
                <span aria-hidden>📱</span> {r.contact_phone}
              </a>
              <div className="text-[12px] text-ink-500 mt-1">
                <a
                  href={`mailto:${r.contact_email}`}
                  className="hover:text-ink-900 transition-colors no-underline text-ink-500"
                >
                  {r.contact_email}
                </a>
              </div>
            </Block>
          </Section>

          <Section
            title={`Artículos · ${r.items.length} ${r.items.length === 1 ? 'producto' : 'productos'}`}
          >
            <Block className="px-3.5 py-1">
              <div className="flex flex-col">
                {r.items.map((it, idx) => (
                  <div
                    key={it.id}
                    className={`grid grid-cols-[38px_minmax(0,1fr)_auto] gap-3 items-center py-2 text-[13px] ${
                      idx < r.items.length - 1 ? 'border-b border-sand-200' : ''
                    }`}
                  >
                    <span className="w-[38px] h-[38px] bg-sand-200 rounded text-[8px] uppercase tracking-[0.08em] text-ink-400 inline-flex items-center justify-center">
                      Pack
                    </span>
                    <div className="min-w-0">
                      <b className="font-medium text-ink-900 block truncate">
                        {it.quantity}× {it.product_name}
                      </b>
                      <small className="block text-[10.5px] text-ink-500 mt-0.5">
                        {fmtDOP(it.unit_price)} DOP / ud
                      </small>
                    </div>
                    <span className="font-serif text-[15px] text-right whitespace-nowrap">
                      {fmtDOP(it.unit_price * it.quantity)}
                      <small className="font-sans text-[10px] text-ink-500 ml-1">DOP</small>
                    </span>
                  </div>
                ))}
              </div>
            </Block>
          </Section>

          <div className="grid grid-cols-1 gap-3.5">
            <Section title="Estado">
              <Block>
                <strong className="text-ink-900 font-semibold block mb-1">
                  {STATUS_LABEL_ES[r.status]}
                </strong>
                <span className="text-[12px] text-ink-700">
                  Actualizada {relativeAndAbsolute(r.updated_at).rel.toLowerCase()}
                </span>
              </Block>
            </Section>
          </div>

          <div className="flex justify-between items-baseline px-4 py-3 bg-sand-100 border border-sand-300 rounded-lg">
            <span className="text-[11px] tracking-[0.08em] uppercase text-ink-700">
              Total a coordinar
            </span>
            <span className="font-serif text-[22px] text-ink-900 leading-none whitespace-nowrap">
              {fmtDOP(r.total_price)}
              <small className="font-sans text-[11px] text-ink-500 ml-1">DOP</small>
            </span>
          </div>

          <Section title="Nota interna · solo equipo FARMAU">
            <textarea
              value={note}
              onChange={handleNoteChange}
              placeholder="Ej. Stock confirmado en farmacia. Cliente prefiere efectivo."
              className="w-full min-h-[80px] px-3 py-2.5 rounded-md border border-sand-300 bg-sand-50 text-[13px] text-ink-900 leading-[1.5] resize-y focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-[3px] focus-visible:ring-clay-700/20 transition-colors"
            />
            <span className="text-[11px] text-ink-500 mt-1 inline-flex items-center gap-1">
              {saveState === 'saving' && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Guardando…
                </>
              )}
              {saveState === 'saved' && <>Guardado</>}
            </span>
          </Section>
        </div>

        <footer className="px-6 py-4 border-t border-sand-300 bg-sand-50 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            {r.contact_phone && (
              <button
                type="button"
                onClick={() => onWhatsapp(r)}
                className="h-11 rounded-lg bg-[#25D366] hover:bg-[#1ebd5a] text-white text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20.5 3.4C18.3 1.2 15.3 0 12.1 0 5.5 0 .2 5.3.2 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.7 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.4z" />
                </svg>
                Abrir WhatsApp
              </button>
            )}
            {next && nextLabel ? (
              <button
                type="button"
                onClick={() => onAdvance(r)}
                disabled={busy}
                className="h-11 rounded-lg bg-clay-700 hover:bg-clay-800 text-sand-50 text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nextLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="h-11 rounded-lg bg-transparent border border-sand-300 text-ink-500 text-[13px] cursor-not-allowed"
              >
                Sin acción siguiente
              </button>
            )}
          </div>
          {r.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => onCancel(r)}
              disabled={busy}
              className="self-center text-[12px] text-brick-600 underline underline-offset-[3px] bg-transparent disabled:opacity-50 hover:text-brick-600/80 transition-colors"
            >
              Cancelar reserva
            </button>
          )}
        </footer>
      </aside>
    </>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-[11px] tracking-[0.16em] uppercase text-ink-500 font-semibold m-0">
        {title}
      </h4>
      {children}
    </section>
  )
}

function Block({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-sand-100 border border-sand-300 rounded-lg px-3.5 py-3 text-[13.5px] leading-[1.55] ${className}`}
    >
      {children}
    </div>
  )
}
