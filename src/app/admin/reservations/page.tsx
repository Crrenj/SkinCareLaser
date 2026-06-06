'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { useConfirmDialog } from '@/components/admin/ConfirmDialog'
import { FilterBar, type SortOption } from '@/components/admin/reservations/FilterBar'
import { BulkActionBar } from '@/components/admin/reservations/BulkActionBar'
import { ReservationsTable } from '@/components/admin/reservations/ReservationsTable'
import { ReservationDrawer } from '@/components/admin/reservations/ReservationDrawer'
import {
  NewReservationDrawer,
  type NewReservationPayload,
} from '@/components/admin/reservations/NewReservationDrawer'
import {
  buildReservationRef,
  type DbReservationStatus,
  type Reservation,
  type StatusFilter,
  fmtDOP,
  nextStatusFor,
} from '@/components/admin/reservations/types'

const PAGE_SIZE = 25

export default function ReservationsAdminPage() {
  const t = useTranslations('Admin.reservations')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filter, setFilter] = useState<StatusFilter>('pending')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [page, setPage] = useState(1)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  const { confirm, dialog: confirmDialog } = useConfirmDialog()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      const res = await fetch(`/api/admin/reservations?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t('errorLoad'))
      setReservations(json.reservations ?? [])
      setCounts(json.counts ?? {})
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errorUnknown'))
    } finally {
      setLoading(false)
    }
  }, [filter, t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset sélection/pagination quand on change de filtre / recherche / tri
  useEffect(() => {
    setSelectedIds(new Set())
    setPage(1)
  }, [filter, search, sort])

  // Filtrage/tri client-side (le filtre status est déjà appliqué côté API)
  const visible = useMemo(() => {
    const haystack = search.trim().toLowerCase()
    const filtered = haystack
      ? reservations.filter((r) =>
          [
            buildReservationRef(r.id, r.created_at),
            r.contact_name,
            r.contact_phone,
            r.contact_email,
          ]
            .filter((v): v is string => !!v)
            .some((v) => v.toLowerCase().includes(haystack)),
        )
      : reservations
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'total-desc':
          return b.total_price - a.total_price
        case 'total-asc':
          return a.total_price - b.total_price
      }
    })
    return sorted
  }, [reservations, search, sort])

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const pageRows = useMemo(
    () => visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visible, page],
  )

  const selectedRows = useMemo(
    () => reservations.filter((r) => selectedIds.has(r.id)),
    [reservations, selectedIds],
  )

  const sharedStatus = useMemo<DbReservationStatus | null>(() => {
    if (selectedRows.length === 0) return null
    const first = selectedRows[0].status
    return selectedRows.every((r) => r.status === first) ? first : null
  }, [selectedRows])

  const expandedReservation = useMemo(
    () => reservations.find((r) => r.id === expandedId) ?? null,
    [reservations, expandedId],
  )

  const totalCount = counts.all ?? reservations.length
  const pendingCount = counts.pending ?? 0

  /* ─────────── Actions ─────────── */

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback((ids: string[], select: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (select) ids.forEach((id) => next.add(id))
      else ids.forEach((id) => next.delete(id))
      return next
    })
  }, [])

  const updateStatus = useCallback(
    async (id: string, status: DbReservationStatus) => {
      setBusyId(id)
      try {
        const res = await fetch('/api/admin/reservations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error')
        await fetchData()
      } catch (e) {
        setError(e instanceof Error ? e.message : t('errorUpdate'))
      } finally {
        setBusyId(null)
      }
    },
    [fetchData, t],
  )

  const updateNote = useCallback(async (id: string, value: string) => {
    const res = await fetch('/api/admin/reservations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, admin_notes: value }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error || t('errorSaveNote'))
    }
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, admin_notes: value } : r)),
    )
  }, [t])

  const createReservation = useCallback(
    async (payload: NewReservationPayload) => {
      const res = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || t('create.errorCreate'))
        throw new Error(json.error || 'create failed')
      }
      toast.success(t('create.successToast'))
      setShowNew(false)
      // Bascule sur "à contacter" pour voir la nouvelle réservation tout de suite
      setFilter('pending')
      await fetchData()
    },
    [fetchData, t],
  )

  const buildWhatsappLink = useCallback((r: Reservation) => {
    const phone = r.contact_phone.replace(/\D/g, '')
    const ref = buildReservationRef(r.id, r.created_at)
    const lines = [
      t('whatsappHello', { name: r.contact_name || '' }).trim(),
      '',
      t('whatsappIntro', { ref }),
      '',
      ...r.items.map((it) => `• ${it.quantity}× ${it.product_name}`),
      '',
      t('whatsappTotal', { amount: fmtDOP(r.total_price), currency: r.currency || DEFAULT_CURRENCY }),
      '',
      t('whatsappCta'),
    ]
    return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`
  }, [t])

  const openWhatsapp = useCallback(
    (r: Reservation) => {
      const url = buildWhatsappLink(r)
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    [buildWhatsappLink],
  )

  const advance = useCallback(
    async (r: Reservation) => {
      const next = nextStatusFor(r.status)
      if (!next) return
      await updateStatus(r.id, next)
    },
    [updateStatus],
  )

  const cancelReservation = useCallback(
    async (r: Reservation) => {
      const ok = await confirm(
        t('cancelConfirm'),
        { title: t('cancelTitle'), confirmLabel: t('cancelButton') },
      )
      if (!ok) return
      await updateStatus(r.id, 'cancelled')
      setExpandedId(null)
    },
    [updateStatus, confirm, t],
  )

  const bulkAdvance = useCallback(async () => {
    if (!sharedStatus) return
    const next = nextStatusFor(sharedStatus)
    if (!next) return
    for (const r of selectedRows) {
      await updateStatus(r.id, next)
    }
    setSelectedIds(new Set())
  }, [selectedRows, sharedStatus, updateStatus])

  const bulkCancel = useCallback(async () => {
    const ok = await confirm(
      t('bulkCancelConfirm', { count: selectedRows.length }),
      { title: t('bulkCancelTitle'), confirmLabel: t('bulkCancelButton') },
    )
    if (!ok) return
    for (const r of selectedRows) {
      await updateStatus(r.id, 'cancelled')
    }
    setSelectedIds(new Set())
  }, [selectedRows, updateStatus, confirm, t])

  const bulkWhatsapp = useCallback(() => {
    // Ouvre un onglet WhatsApp pour chaque sélection
    for (const r of selectedRows) {
      if (!r.contact_phone) continue
      window.open(buildWhatsappLink(r), '_blank', 'noopener,noreferrer')
    }
  }, [selectedRows, buildWhatsappLink])

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: t('crumbOps') },
          { label: t('title') },
        ]}
        title={t('title')}
        actions={
          <>
            <button
              type="button"
              className="h-9 px-3.5 rounded-md text-[13px] border border-sand-300 bg-transparent text-ink-700 hover:bg-sand-100 hover:text-ink-900 transition-colors inline-flex items-center gap-1.5"
              onClick={() => {
                if (typeof window === 'undefined') return
                toast.info(t('exportCsvSoon'))
              }}
            >
              <Download className="w-3.5 h-3.5" />
              {t('exportCsv')}
            </button>
            <button
              type="button"
              className="h-9 px-4 rounded-md text-[13px] font-medium bg-clay-700 hover:bg-accent-hover text-on-accent inline-flex items-center gap-1.5 transition-colors"
              onClick={() => setShowNew(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              {t('newManual')}
            </button>
          </>
        }
      />

      {/* Sous-titre compteurs */}
      <div className="px-5 lg:px-8 pt-3 text-[12.5px] text-ink-500">
        {t('countTotal', { count: totalCount })} · {t('countPending', { count: pendingCount })}
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
        sort={sort}
        onSortChange={setSort}
      />

      <BulkActionBar
        count={selectedIds.size}
        sharedStatus={sharedStatus}
        onClear={() => setSelectedIds(new Set())}
        onWhatsappReminder={bulkWhatsapp}
        onAdvance={bulkAdvance}
        onCancel={bulkCancel}
      />

      {error && (
        <div
          role="alert"
          className="mx-5 lg:mx-8 mt-4 bg-brick-600/10 border border-brick-600/25 text-brick-600 text-[13px] rounded-md px-3 py-2"
        >
          {error}
        </div>
      )}

      <div className="px-0 lg:px-8 py-4 relative">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-clay-700" />
          </div>
        ) : pageRows.length === 0 ? (
          <EmptyState t={t} onReset={() => {
            setSearch('')
            setFilter('all')
            setSort('newest')
          }} />
        ) : (
          <ReservationsTable
            rows={pageRows}
            selectedIds={selectedIds}
            expandedId={expandedId}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onOpenDetail={(id) => setExpandedId(id)}
            onWhatsapp={openWhatsapp}
            onAdvance={advance}
          />
        )}

        {!loading && pageRows.length > 0 && totalPages > 1 && (
          <div className="flex justify-between items-center px-5 lg:px-3 py-4 text-[12.5px] text-ink-700 border-t border-sand-200 bg-sand-50">
            <span>
              {t('showing', {
                from: (page - 1) * PAGE_SIZE + 1,
                to: Math.min(page * PAGE_SIZE, visible.length),
                total: visible.length,
              })}
            </span>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {expandedReservation && (
        <ReservationDrawer
          reservation={expandedReservation}
          onClose={() => setExpandedId(null)}
          onWhatsapp={openWhatsapp}
          onAdvance={advance}
          onCancel={cancelReservation}
          onUpdateNote={updateNote}
          busy={busyId === expandedReservation.id}
        />
      )}

      <NewReservationDrawer
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={createReservation}
      />
      {confirmDialog}
    </>
  )
}

function EmptyState({ t, onReset }: { t: (key: string, values?: Record<string, string | number>) => string; onReset: () => void }) {
  return (
    <div className="py-16 px-5 text-center flex flex-col items-center gap-3.5">
      <svg width="80" height="80" viewBox="0 0 120 120" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r="56"
          fill="var(--color-sand-100)"
          stroke="var(--color-sand-300)"
        />
        <g
          transform="translate(30,30)"
          stroke="var(--color-ink-700)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="6" y="10" width="48" height="40" rx="3" />
          <line x1="6" y1="22" x2="54" y2="22" />
          <line x1="14" y1="32" x2="36" y2="32" opacity=".4" />
          <line x1="14" y1="40" x2="28" y2="40" opacity=".4" />
        </g>
      </svg>
      <h3 className="font-serif text-[26px] text-ink-900 m-0 leading-[1.1]">
        {t('emptyTitle')}{' '}
        <em className="not-italic text-clay-700" style={{ fontStyle: 'italic' }}>
          {t('emptyTitleEmphasis')}
        </em>
      </h3>
      <p className="text-[13px] text-ink-700 max-w-xs m-0 leading-[1.5]">
        {t('emptyBody')}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 h-9 px-4 rounded-md text-[13px] border border-sand-300 bg-transparent text-ink-700 hover:bg-sand-100 hover:text-ink-900 transition-colors"
      >
        {t('emptyReset')}
      </button>
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  const pageButtons: (number | '…')[] = useMemo(() => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const out: (number | '…')[] = [1]
    if (page > 3) out.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i += 1) {
      out.push(i)
    }
    if (page < totalPages - 2) out.push('…')
    out.push(totalPages)
    return out
  }, [page, totalPages])

  return (
    <div className="flex gap-1 items-center">
      <PageBtn disabled={page === 1} onClick={() => onChange(page - 1)} label="‹" />
      {pageButtons.map((p, i) =>
        p === '…' ? (
          <span key={`${p}-${i}`} className="px-1 text-ink-500">
            …
          </span>
        ) : (
          <PageBtn
            key={p}
            active={p === page}
            onClick={() => onChange(p)}
            label={String(p)}
          />
        ),
      )}
      <PageBtn
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        label="›"
      />
    </div>
  )
}

function PageBtn({
  label,
  onClick,
  active,
  disabled,
}: {
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-[30px] h-[30px] rounded-md border text-[12.5px] inline-flex items-center justify-center transition-colors ${
        active
          ? 'bg-ink-900 text-sand-50 border-ink-900 font-semibold'
          : 'bg-sand-50 text-ink-700 border-sand-300 hover:bg-sand-200 hover:text-ink-900 disabled:opacity-40 disabled:hover:bg-sand-50 disabled:hover:text-ink-700 disabled:cursor-not-allowed'
      }`}
    >
      {label}
    </button>
  )
}
