'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AccountSetupDialog,
  type AccountSetupInfo,
} from '@/components/admin/customers/AccountSetupDialog'
import { resolveCustomer } from '@/components/admin/customers/resolveCustomer'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { useConfirmDialog } from '@/components/admin/ConfirmDialog'
import { BulkActionBar } from '@/components/admin/reservations/BulkActionBar'
import { ReservationsTable } from '@/components/admin/reservations/ReservationsTable'
import { ReservationDrawer } from '@/components/admin/reservations/ReservationDrawer'
import { TablePagination } from '@/components/admin/reservations/TablePagination'
import {
  NewReservationDrawer,
  type NewReservationPayload,
} from '@/components/admin/reservations/NewReservationDrawer'
import {
  SalesFilterBar,
  type SalesSortOption,
  type SalesSourceFilter,
} from '@/components/admin/sales/SalesFilterBar'
import { SalesSummary } from '@/components/admin/sales/SalesSummary'
import {
  buildReservationRef,
  fmtDOP,
  type DbReservationStatus,
  type Reservation,
} from '@/components/admin/reservations/types'

const PAGE_SIZE = 25

/** Date de référence d'une vente : retrait (collected_at), repli création. */
function saleTime(r: Reservation): number {
  return new Date(r.collected_at ?? r.created_at).getTime()
}

export default function SalesAdminPage() {
  const t = useTranslations('Admin.sales')
  const tr = useTranslations('Admin.reservations')
  const locale = useLocale()

  const [rows, setRows] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filter, setFilter] = useState<SalesSourceFilter>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SalesSortOption>('newest')
  const [page, setPage] = useState(1)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  // Lien de configuration à transmettre après création d'un compte express.
  const [setupInfo, setSetupInfo] = useState<AccountSetupInfo | null>(null)

  const { confirm, dialog: confirmDialog } = useConfirmDialog()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/reservations?scope=sales')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t('errorLoad'))
      setRows(json.reservations ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errorUnknown'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setSelectedIds(new Set())
    setPage(1)
  }, [filter, search, sort])

  // Compteurs d'onglets par origine (sur l'ensemble du journal).
  const counts = useMemo<Record<SalesSourceFilter, number>>(() => {
    const c: Record<SalesSourceFilter, number> = { all: rows.length, account: 0, guest: 0, counter: 0 }
    for (const r of rows) c[r.source] += 1
    return c
  }, [rows])

  const visible = useMemo(() => {
    const haystack = search.trim().toLowerCase()
    const bySource = filter === 'all' ? rows : rows.filter((r) => r.source === filter)
    const filtered = haystack
      ? bySource.filter((r) =>
          [
            buildReservationRef(r.id, r.created_at),
            r.contact_name,
            r.contact_phone,
            r.contact_email,
          ]
            .filter((v): v is string => !!v)
            .some((v) => v.toLowerCase().includes(haystack)),
        )
      : bySource
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return saleTime(b) - saleTime(a)
        case 'oldest':
          return saleTime(a) - saleTime(b)
        case 'total-desc':
          return b.total_price - a.total_price
        case 'total-asc':
          return a.total_price - b.total_price
      }
    })
    return sorted
  }, [rows, search, filter, sort])

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const pageRows = useMemo(
    () => visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visible, page],
  )

  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.has(r.id)),
    [rows, selectedIds],
  )

  // Toutes les ventes partagent le statut « collected ».
  const sharedStatus: DbReservationStatus | null = selectedRows.length > 0 ? 'collected' : null

  const expandedReservation = useMemo(
    () => rows.find((r) => r.id === expandedId) ?? null,
    [rows, expandedId],
  )

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

  // Annuler une vente = repasser en « cancelled » → la RPC PATCH restaure le stock
  // et la ligne quitte le journal (elle réapparaît côté Réservations / Annulées).
  const voidSale = useCallback(
    async (id: string) => {
      setBusyId(id)
      try {
        const res = await fetch('/api/admin/reservations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'cancelled' }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || tr('errorUpdate'))
        await fetchData()
      } catch (e) {
        setError(e instanceof Error ? e.message : tr('errorUpdate'))
      } finally {
        setBusyId(null)
      }
    },
    [fetchData, tr],
  )

  const updateNote = useCallback(async (id: string, value: string) => {
    const res = await fetch('/api/admin/reservations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, admin_notes: value }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error || tr('errorSaveNote'))
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, admin_notes: value } : r)))
  }, [tr])

  const createSale = useCallback(
    async (payload: NewReservationPayload) => {
      // 1) Résout l'identité client (compte existant / création express / anonyme).
      let resolved: { userId: string | null; setup: AccountSetupInfo | null }
      try {
        resolved = await resolveCustomer(payload.customer, locale)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t('errorCreate'))
        throw e
      }

      // 2) Vente comptoir liée (ou anonyme).
      const res = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: payload.contact_name,
          contact_phone: payload.contact_phone,
          contact_email: payload.contact_email,
          admin_notes: payload.admin_notes,
          sold: true,
          items: payload.items,
          user_id: resolved.userId,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || t('errorCreate'))
        throw new Error(json.error || 'create failed')
      }
      toast.success(t('createdToast'))
      setShowNew(false)
      await fetchData()
      // 3) Si un compte vient d'être créé, proposer l'envoi du lien de config.
      if (resolved.setup) setSetupInfo(resolved.setup)
    },
    [fetchData, t, locale],
  )

  const buildWhatsappLink = useCallback((r: Reservation) => {
    const phone = (r.contact_phone ?? '').replace(/\D/g, '')
    const ref = buildReservationRef(r.id, r.created_at)
    const lines = [
      tr('whatsappHello', { name: r.contact_name || '' }).trim(),
      '',
      tr('whatsappIntro', { ref }),
      '',
      ...r.items.map((it) => `• ${it.quantity}× ${it.product_name}`),
      '',
      tr('whatsappTotal', { amount: fmtDOP(r.total_price), currency: r.currency || DEFAULT_CURRENCY }),
      '',
      tr('whatsappCta'),
    ]
    return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`
  }, [tr])

  const openWhatsapp = useCallback(
    (r: Reservation) => {
      window.open(buildWhatsappLink(r), '_blank', 'noopener,noreferrer')
    },
    [buildWhatsappLink],
  )

  const cancelSale = useCallback(
    async (r: Reservation) => {
      const ok = await confirm(t('voidConfirm'), {
        title: t('voidTitle'),
        confirmLabel: t('voidButton'),
      })
      if (!ok) return
      await voidSale(r.id)
      setExpandedId(null)
    },
    [voidSale, confirm, t],
  )

  const bulkVoid = useCallback(async () => {
    const ok = await confirm(t('bulkVoidConfirm', { count: selectedRows.length }), {
      title: t('bulkVoidTitle'),
      confirmLabel: t('bulkVoidButton'),
    })
    if (!ok) return
    for (const r of selectedRows) {
      await voidSale(r.id)
    }
    setSelectedIds(new Set())
  }, [selectedRows, voidSale, confirm, t])

  const bulkWhatsapp = useCallback(() => {
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
          <button
            type="button"
            className="h-9 px-4 rounded-md text-[13px] font-medium bg-clay-700 hover:bg-accent-hover text-on-accent inline-flex items-center gap-1.5 transition-colors"
            onClick={() => setShowNew(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            {t('newCounterSale')}
          </button>
        }
      />

      <SalesSummary rows={rows} />

      <div className="px-5 lg:px-8 pt-3 text-[12.5px] text-ink-500">
        {t('countTotal', { count: counts.all })}
      </div>

      <SalesFilterBar
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
        onAdvance={() => {}}
        onCancel={bulkVoid}
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
          <EmptyState
            t={t}
            onReset={() => {
              setSearch('')
              setFilter('all')
              setSort('newest')
            }}
          />
        ) : (
          <ReservationsTable
            rows={pageRows}
            selectedIds={selectedIds}
            expandedId={expandedId}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onOpenDetail={(id) => setExpandedId(id)}
            onWhatsapp={openWhatsapp}
            onAdvance={() => {}}
            dateField="collected_at"
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
            <TablePagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {expandedReservation && (
        <ReservationDrawer
          reservation={expandedReservation}
          onClose={() => setExpandedId(null)}
          onWhatsapp={openWhatsapp}
          onAdvance={() => {}}
          onCancel={cancelSale}
          onUpdateNote={updateNote}
          busy={busyId === expandedReservation.id}
        />
      )}

      <NewReservationDrawer
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={createSale}
        mode="sale"
      />
      <AccountSetupDialog info={setupInfo} onClose={() => setSetupInfo(null)} />
      {confirmDialog}
    </>
  )
}

function EmptyState({
  t,
  onReset,
}: {
  t: (key: string, values?: Record<string, string | number>) => string
  onReset: () => void
}) {
  return (
    <div className="py-16 px-5 text-center flex flex-col items-center gap-3.5">
      <svg width="80" height="80" viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r="56" fill="var(--color-sand-100)" stroke="var(--color-sand-300)" />
        <g
          transform="translate(34,32)"
          stroke="var(--color-ink-700)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12h44l-4 30H8z" />
          <path d="M16 12a12 12 0 0 1 24 0" />
        </g>
      </svg>
      <h3 className="font-serif text-[26px] text-ink-900 m-0 leading-[1.1]">
        {t('empty.title')}{' '}
        <em className="not-italic text-clay-700" style={{ fontStyle: 'italic' }}>
          {t('empty.titleEmphasis')}
        </em>
      </h3>
      <p className="text-[13px] text-ink-700 max-w-xs m-0 leading-[1.5]">{t('empty.body')}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 h-9 px-4 rounded-md text-[13px] border border-sand-300 bg-transparent text-ink-700 hover:bg-sand-100 hover:text-ink-900 transition-colors"
      >
        {t('empty.reset')}
      </button>
    </div>
  )
}
