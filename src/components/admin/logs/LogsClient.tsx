'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'

type AuditRow = {
  id: string
  createdAt: string
  action: 'create' | 'update' | 'delete' | string
  entity: string
  entityId: string | null
  summary: string | null
  isHighImpact: boolean
  diff: unknown
  actor: { id: string; email: string | null; name: string | null } | null
}

type ActorOption = { id: string; label: string }

const PER_PAGE = 50

// Libellés ES des entités (contenu, comme les résumés — pas d'i18n par entité).
const ENTITY_LABEL_ES: Record<string, string> = {
  product: 'Producto',
  reservation: 'Reserva',
  expense: 'Gasto',
  stock: 'Stock',
  merma: 'Merma',
  promotion: 'Promoción',
  admin_user: 'Acceso admin',
  user: 'Cliente',
  setting: 'Ajustes',
  appearance: 'Apariencia',
  home_layout: 'Inicio',
  banner: 'Banner',
  post: 'Artículo',
  review: 'Reseña',
  message: 'Mensaje',
  tag: 'Etiqueta',
  tag_type: 'Tipo de etiqueta',
  brand: 'Marca',
  range: 'Gama',
  newsletter: 'Newsletter',
  upload: 'Imagen',
}
const ENTITY_OPTIONS = Object.keys(ENTITY_LABEL_ES)

type Filters = {
  entity: string
  action: string
  actor: string
  from: string
  to: string
  highImpact: boolean
}

const EMPTY_FILTERS: Filters = {
  entity: '',
  action: '',
  actor: '',
  from: '',
  to: '',
  highImpact: false,
}

export function LogsClient() {
  const t = useTranslations('Admin.logs')
  const tc = useTranslations('Admin.common')
  const [rows, setRows] = useState<AuditRow[]>([])
  const [actors, setActors] = useState<ActorOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const load = useCallback(async (p: number, f: Filters) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p), perPage: String(PER_PAGE) })
      if (f.entity) params.set('entity', f.entity)
      if (f.action) params.set('action', f.action)
      if (f.actor) params.set('actor', f.actor)
      if (f.from) params.set('from', f.from)
      if (f.to) params.set('to', f.to)
      if (f.highImpact) params.set('highImpact', '1')
      const res = await fetch(`/api/admin/logs?${params.toString()}`)
      if (!res.ok) throw new Error('fetch_failed')
      const data = (await res.json()) as { rows: AuditRow[]; actors: ActorOption[] }
      setRows(data.rows ?? [])
      setActors(data.actors ?? [])
    } catch {
      setError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load(page, filters)
  }, [load, page, filters])

  const patchFilter = (patch: Partial<Filters>) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const selectClass =
    'h-10 px-3 rounded-md border border-sand-300 bg-sand-50 text-[13.5px] text-ink-900 focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-[3px] focus-visible:ring-clay-700/15 transition-colors'

  return (
    <div className="flex flex-col gap-5">
      {/* Filtres */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-500 font-semibold">{t('filterEntity')}</span>
          <select className={selectClass} value={filters.entity} onChange={(e) => patchFilter({ entity: e.target.value })}>
            <option value="">{t('filterAll')}</option>
            {ENTITY_OPTIONS.map((e) => (
              <option key={e} value={e}>{ENTITY_LABEL_ES[e]}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-500 font-semibold">{t('filterAction')}</span>
          <select className={selectClass} value={filters.action} onChange={(e) => patchFilter({ action: e.target.value })}>
            <option value="">{t('filterAll')}</option>
            <option value="create">{t('actionCreate')}</option>
            <option value="update">{t('actionUpdate')}</option>
            <option value="delete">{t('actionDelete')}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-500 font-semibold">{t('filterActor')}</span>
          <select className={selectClass} value={filters.actor} onChange={(e) => patchFilter({ actor: e.target.value })}>
            <option value="">{t('filterAll')}</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-500 font-semibold">{t('filterFrom')}</span>
          <input type="date" className={selectClass} value={filters.from} onChange={(e) => patchFilter({ from: e.target.value })} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-500 font-semibold">{t('filterTo')}</span>
          <input type="date" className={selectClass} value={filters.to} onChange={(e) => patchFilter({ to: e.target.value })} />
        </label>

        <label className="flex items-center gap-2 h-10 px-3 rounded-md border border-sand-300 bg-sand-50 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.highImpact}
            onChange={(e) => patchFilter({ highImpact: e.target.checked })}
            className="accent-clay-700"
          />
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-900">
            <ShieldAlert className="w-3.5 h-3.5 text-ochre-600" />
            {t('filterHighImpact')}
          </span>
        </label>

        {(filters.entity || filters.action || filters.actor || filters.from || filters.to || filters.highImpact) && (
          <button
            type="button"
            onClick={() => { setPage(1); setFilters(EMPTY_FILTERS) }}
            className="h-10 px-3 text-[12.5px] text-clay-700 hover:text-accent-hover underline-offset-2 hover:underline"
          >
            {t('filterReset')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-sand-50 border border-sand-300 rounded-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink-500">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {tc('loading')}
          </div>
        ) : error ? (
          <div className="py-16 text-center text-brick-600">{error}</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-ink-500">{t('empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="bg-sand-100 text-left text-[11px] uppercase tracking-[0.12em] text-ink-500 font-semibold border-b border-sand-300">
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3">{t('colWhen')}</th>
                  <th className="px-4 py-3">{t('colActor')}</th>
                  <th className="px-4 py-3">{t('colAction')}</th>
                  <th className="px-4 py-3">{t('colEntity')}</th>
                  <th className="px-4 py-3">{t('colSummary')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isOpen = expanded.has(r.id)
                  const hasDiff = r.diff != null
                  return (
                    <FragmentRow
                      key={r.id}
                      row={r}
                      isOpen={isOpen}
                      hasDiff={hasDiff}
                      onToggle={() => toggleExpand(r.id)}
                      t={t}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-[12.5px] text-ink-500">
        <span>{t('pageLabel', { page })}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-1.5 rounded-sm border border-sand-300 hover:bg-sand-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('pagePrev')}
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading || rows.length < PER_PAGE}
            className="px-3 py-1.5 rounded-sm border border-sand-300 hover:bg-sand-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('pageNext')}
          </button>
        </div>
      </div>
    </div>
  )
}

function FragmentRow({
  row,
  isOpen,
  hasDiff,
  onToggle,
  t,
}: {
  row: AuditRow
  isOpen: boolean
  hasDiff: boolean
  onToggle: () => void
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <>
      <tr className="border-b border-sand-200 last:border-b-0 hover:bg-sand-50 transition-colors align-top">
        <td className="px-4 py-3">
          {hasDiff && (
            <button
              type="button"
              onClick={onToggle}
              aria-label={t('details')}
              className="text-ink-500 hover:text-ink-900"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </td>
        <td className="px-4 py-3 text-ink-700 whitespace-nowrap">{formatDateTime(row.createdAt)}</td>
        <td className="px-4 py-3">
          <div className="font-medium text-ink-900">{row.actor?.name || row.actor?.email || t('systemActor')}</div>
          {row.actor?.email && row.actor?.name && (
            <div className="text-[12px] text-ink-500 truncate max-w-[200px]">{row.actor.email}</div>
          )}
        </td>
        <td className="px-4 py-3">
          <ActionBadge action={row.action} t={t} />
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1.5">
            {row.isHighImpact && <ShieldAlert className="w-3.5 h-3.5 text-ochre-600" />}
            <span className="text-ink-700">{ENTITY_LABEL_ES[row.entity] ?? row.entity}</span>
          </span>
        </td>
        <td className="px-4 py-3 text-ink-900">{row.summary ?? '—'}</td>
      </tr>
      {isOpen && hasDiff && (
        <tr className="border-b border-sand-200 bg-sand-100/60">
          <td />
          <td colSpan={5} className="px-4 py-3">
            <pre className="text-[12px] text-ink-700 whitespace-pre-wrap break-all font-mono">
              {JSON.stringify(row.diff, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}

function ActionBadge({ action, t }: { action: string; t: ReturnType<typeof useTranslations> }) {
  const map: Record<string, { label: string; cls: string }> = {
    create: { label: t('actionCreate'), cls: 'bg-olive-100 text-olive-700' },
    update: { label: t('actionUpdate'), cls: 'bg-sand-200 text-ink-700' },
    delete: { label: t('actionDelete'), cls: 'bg-brick-50 text-brick-700' },
  }
  const m = map[action] ?? { label: action, cls: 'bg-sand-200 text-ink-700' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${m.cls}`}>
      {m.label}
    </span>
  )
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
