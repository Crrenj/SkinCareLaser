'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Loader2 } from 'lucide-react'
import { PopClose } from '@/components/ui/PopClose'
import type { Reservation } from './types'
import {
  ORIGIN_CHIP_CLASS,
  STATUS_BADGE_CLASS,
  buildReservationRef,
  fmtDOP,
  nextStatusFor,
} from './types'
import { useReservationFormat } from './useReservationFormat'

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
  const t = useTranslations('Admin.reservations')
  const { statusLabel, nextStatusLabel, relativeAndAbsolute, originLabel, displayName } =
    useReservationFormat()
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Mobile scrim */}
      <div
        className="lg:hidden fixed inset-0 z-30 bg-[--pop-backdrop] backdrop-blur-[14px] backdrop-saturate-[120%]"
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-drawer-title"
        className="fixed lg:absolute top-0 right-0 bottom-0 z-40 w-full sm:w-[520px] bg-sand-50 flex flex-col overflow-hidden rounded-tl-[--pop-radius-drawer] rounded-bl-[--pop-radius-drawer]"
        style={{ boxShadow: 'var(--pop-shadow-drawer-r)' }}
      >
        {/* Header — eyebrow ref+date, name as title, status badge */}
        <header className="px-[22px] pt-[18px] pb-4 flex justify-between items-start gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium">
              {ref} · {date.abs}
            </span>
            <h3
              id="reservation-drawer-title"
              className="font-serif text-[22px] text-ink-900 m-0 mt-1"
            >
              {displayName(r.contact_name, r.source)}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span
                className={`self-start inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-[0.04em] uppercase ${
                  STATUS_BADGE_CLASS[r.status]
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                {statusLabel(r.status)}
              </span>
              {r.source !== 'account' && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.04em] uppercase ${ORIGIN_CHIP_CLASS[r.source]}`}
                >
                  {originLabel(r.source)}
                </span>
              )}
            </div>
          </div>
          <PopClose onClick={onClose} />
        </header>

        {/* Body — sections in cards */}
        <div className="flex-1 overflow-y-auto px-[22px] py-[14px] flex flex-col gap-[14px]">
          <Section title={t('drawer.sectionClient')}>
            <CardBlock>
              <Row label={t('drawer.rowName')} value={displayName(r.contact_name, r.source)} />
              <Row
                label={t('drawer.rowPhone')}
                value={r.contact_phone || '—'}
                isLink={r.contact_phone ? `tel:${r.contact_phone}` : undefined}
              />
              <Row
                label={t('drawer.rowEmail')}
                value={r.contact_email || '—'}
                isLink={r.contact_email ? `mailto:${r.contact_email}` : undefined}
              />
            </CardBlock>
          </Section>

          <Section title={t('drawer.sectionProducts', { count: r.items.length })}>
            <CardBlock className="px-[14px] py-1">
              <div className="flex flex-col">
                {r.items.map((it, idx) => (
                  <div
                    key={it.id}
                    className={`grid grid-cols-[1fr_auto] gap-2 py-2 text-[12.5px] ${
                      idx < r.items.length - 1 ? 'border-b border-sand-200' : ''
                    }`}
                  >
                    <div className="text-ink-900">
                      {it.product_name}
                      <small className="block text-ink-500 font-mono text-[10.5px] mt-0.5">
                        {t('drawer.perUnit', { qty: it.quantity, price: fmtDOP(it.unit_price) })}
                      </small>
                    </div>
                    <span className="font-mono text-[12px] text-ink-900 text-right">
                      {fmtDOP(it.unit_price * it.quantity)} DOP
                    </span>
                  </div>
                ))}
              </div>
            </CardBlock>
          </Section>

          <Section title={t('drawer.sectionTotal')}>
            <CardBlock>
              <Row label={t('drawer.subtotal')} value={`${fmtDOP(r.total_price)} DOP`} />
              <div className="flex justify-between items-baseline py-[7px] font-semibold">
                <span className="text-[11px] tracking-[0.06em] uppercase text-ink-900 font-medium">
                  {t('drawer.total')}
                </span>
                <span className="font-mono text-[14px] text-ink-900">{fmtDOP(r.total_price)} DOP</span>
              </div>
            </CardBlock>
          </Section>

          <Section title={t('drawer.noteSection')}>
            <textarea
              value={note}
              onChange={handleNoteChange}
              placeholder={t('drawer.notePlaceholder')}
              className="w-full min-h-[80px] px-3 py-2.5 rounded-[10px] border border-sand-200 bg-sand-50 text-[13px] text-ink-900 leading-[1.5] resize-y focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-[3px] focus-visible:ring-clay-700/20 transition-colors"
            />
            <span className="text-[11px] text-ink-500 mt-1 inline-flex items-center gap-1">
              {saveState === 'saving' && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('drawer.saving')}
                </>
              )}
              {saveState === 'saved' && <>{t('drawer.saved')}</>}
            </span>
          </Section>
        </div>

        {/* Footer — scroll-fade + action buttons */}
        <footer className="px-[22px] py-[14px] pb-[18px] bg-sand-50 flex flex-col gap-2.5 relative">
          <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-b from-transparent to-sand-50 pointer-events-none" />

          <div className="grid grid-cols-2 gap-2">
            {r.contact_phone && (
              <button
                type="button"
                onClick={() => onWhatsapp(r)}
                className="h-11 rounded-[10px] bg-[#25D366] hover:bg-[#1ebd5a] text-white text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20.5 3.4C18.3 1.2 15.3 0 12.1 0 5.5 0 .2 5.3.2 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.7 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.4z" />
                </svg>
                {t('drawer.openWhatsapp')}
              </button>
            )}
            {next && nextLabel ? (
              <button
                type="button"
                onClick={() => onAdvance(r)}
                disabled={busy}
                className="h-11 rounded-[10px] bg-ink-900 hover:bg-ink-800 text-sand-50 text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nextLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="h-11 rounded-[10px] bg-transparent border border-sand-300 text-ink-500 text-[13px] cursor-not-allowed"
              >
                {t('drawer.noNextAction')}
              </button>
            )}
          </div>

          {r.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => onCancel(r)}
              disabled={busy}
              className="self-center text-[11.5px] text-ink-500 hover:text-brick-600 underline underline-offset-[3px] bg-transparent disabled:opacity-50 transition-colors py-0.5"
            >
              {t('drawer.cancelReservation')}
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
      <h4 className="text-[10.5px] tracking-[0.16em] uppercase text-ink-700 font-semibold m-0">
        {title}
      </h4>
      {children}
    </section>
  )
}

function CardBlock({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-sand-50 border border-sand-200 rounded-[10px] px-[14px] py-1 text-[13px] ${className}`}
    >
      {children}
    </div>
  )
}

function Row({
  label,
  value,
  isLink,
}: {
  label: string
  value: string
  isLink?: string
}) {
  return (
    <div className="flex justify-between items-baseline py-[7px] border-b border-sand-200 last:border-b-0 gap-[14px]">
      <span className="text-ink-500 text-[11px] tracking-[0.06em] uppercase font-medium shrink-0">
        {label}
      </span>
      {isLink ? (
        <a
          href={isLink}
          className="font-mono text-[12.5px] text-ink-900 text-right hover:text-clay-700 transition-colors truncate"
        >
          {value}
        </a>
      ) : (
        <span className="font-mono text-[12.5px] text-ink-900 text-right truncate">{value}</span>
      )}
    </div>
  )
}
