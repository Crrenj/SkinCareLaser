'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Shield, ShieldOff, Mail, Phone, Globe, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

type Row = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  phone: string | null
  preferredLocale: string | null
  isAdmin: boolean
  createdAt: string
  lastSignInAt: string | null
}

const PER_PAGE = 50

export function UsersClient() {
  const t = useTranslations('Admin.users')
  const tc = useTranslations('Admin.common')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p), perPage: String(PER_PAGE) })
      if (q.trim()) params.set('search', q.trim())
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (!res.ok) throw new Error('fetch_failed')
      const data = (await res.json()) as { users: Row[] }
      setRows(data.users ?? [])
    } catch {
      setError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load(page, search)
  }, [load, page, search])

  const handleToggleAdmin = useCallback(
    async (row: Row) => {
      if (!window.confirm(
          row.isAdmin
            ? t('confirmDemote', { email: row.email ?? '' })
            : t('confirmPromote', { email: row.email ?? '' }),
        )) return
      setUpdatingId(row.id)
      try {
        const res = await fetch(`/api/admin/users/${row.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isAdmin: !row.isAdmin }),
        })
        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as { error?: string } | null
          if (json?.error === 'cannot_demote_self') {
            toast.error(t('errorCannotDemoteSelf'))
          } else {
            toast.error(t('errorUpdateFailed'))
          }
          return
        }
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, isAdmin: !row.isAdmin } : r)),
        )
      } finally {
        setUpdatingId(null)
      }
    },
    [t],
  )

  const stats = useMemo(() => {
    return {
      total: rows.length,
      admins: rows.filter((r) => r.isAdmin).length,
      withPhone: rows.filter((r) => r.phone).length,
    }
  }, [rows])

  return (
    <div className="flex flex-col gap-5">
      {/* Stats header */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label={t('statUsersPage')} value={stats.total} />
        <StatCard label={t('statAdmins')} value={stats.admins} />
        <StatCard label={t('statWithPhone')} value={stats.withPhone} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          placeholder={t('searchPlaceholder')}
          className="w-full h-10 pl-9 pr-3 rounded-md border border-sand-300 bg-white text-[14px] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-[3px] focus-visible:ring-clay-700/15 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-sand-300 rounded-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink-500">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {tc('loading')}
          </div>
        ) : error ? (
          <div className="py-16 text-center text-brick-600">{error}</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-ink-500">
            {t('emptySearch')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="bg-sand-100 text-left text-[11px] uppercase tracking-[0.12em] text-ink-500 font-semibold border-b border-sand-300">
                  <th className="px-4 py-3">{t('colUser')}</th>
                  <th className="px-4 py-3">{t('colContact')}</th>
                  <th className="px-4 py-3">{t('colLang')}</th>
                  <th className="px-4 py-3">{t('colCreated')}</th>
                  <th className="px-4 py-3">{t('colLastLogin')}</th>
                  <th className="px-4 py-3 text-right">{t('colRole')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-sand-200 last:border-b-0 hover:bg-sand-50 transition-colors"
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-ink-900">
                        {formatName(r) || <span className="text-ink-500 italic">—</span>}
                      </div>
                      <div className="text-[12px] text-ink-500 truncate max-w-[260px]" title={r.email ?? undefined}>
                        {r.email ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        {r.email && (
                          <a
                            href={`mailto:${r.email}`}
                            className="inline-flex items-center gap-1 text-[12.5px] text-clay-700 hover:text-clay-800"
                          >
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[180px]">{r.email}</span>
                          </a>
                        )}
                        {r.phone && (
                          <a
                            href={`https://wa.me/${r.phone.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[12.5px] text-clay-700 hover:text-clay-800"
                          >
                            <Phone className="w-3 h-3" />
                            {r.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-ink-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-ink-500" />
                        {r.preferredLocale ?? 'auto'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-ink-700">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-top text-ink-700">
                      {r.lastSignInAt ? formatDate(r.lastSignInAt) : <span className="text-ink-500 italic">{t('never')}</span>}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleAdmin(r)}
                        disabled={updatingId === r.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11.5px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          r.isAdmin
                            ? 'bg-clay-700 hover:bg-clay-800 text-sand-50'
                            : 'bg-transparent border border-sand-400 text-ink-700 hover:border-ink-700 hover:text-ink-900'
                        }`}
                      >
                        {updatingId === r.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : r.isAdmin ? (
                          <Shield className="w-3 h-3" />
                        ) : (
                          <ShieldOff className="w-3 h-3" />
                        )}
                        {r.isAdmin ? t('admin') : t('promote')}
                      </button>
                    </td>
                  </tr>
                ))}
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

function formatName(r: Row): string {
  return (
    r.displayName ||
    [r.firstName, r.lastName].filter(Boolean).join(' ') ||
    ''
  )
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-sand-300 rounded-md px-4 py-3">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-500 font-semibold mb-1">
        {label}
      </div>
      <div className="font-serif text-[26px] text-ink-900 leading-none">{value}</div>
    </div>
  )
}
