'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Search, Trash2, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

type Row = {
  id: string
  email: string
  lang: string
  created_at: string
  confirmed_at: string | null
  ip: string | null
}

type Stats = { total: number; byLang: Record<string, number> }

const LIMIT = 500

export function NewsletterClient() {
  const t = useTranslations('Admin.newsletter')
  const tc = useTranslations('Admin.common')
  const [rows, setRows] = useState<Row[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [lang, setLang] = useState<'all' | 'fr' | 'es' | 'en'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async (q: string, l: typeof lang) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: String(LIMIT) })
      if (q.trim()) params.set('search', q.trim())
      if (l !== 'all') params.set('lang', l)
      const res = await fetch(`/api/admin/newsletter?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { subscribers: Row[]; stats: Stats }
      setRows(data.subscribers ?? [])
      setStats(data.stats ?? null)
    } catch {
      setError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load(search, lang)
  }, [load, search, lang])

  const handleDelete = useCallback(async (row: Row) => {
    if (!window.confirm(t('confirmDelete', { email: row.email }))) return
    setDeletingId(row.id)
    try {
      const res = await fetch(`/api/admin/newsletter/${row.id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error(t('deleteFailed'))
        return
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id))
      setStats((s) =>
        s
          ? {
              total: Math.max(0, s.total - 1),
              byLang: { ...s.byLang, [row.lang]: Math.max(0, (s.byLang[row.lang] ?? 0) - 1) },
            }
          : s,
      )
    } finally {
      setDeletingId(null)
    }
  }, [t])

  const handleExportCsv = useCallback(() => {
    const params = new URLSearchParams({ format: 'csv', limit: '5000' })
    if (search.trim()) params.set('search', search.trim())
    if (lang !== 'all') params.set('lang', lang)
    window.location.href = `/api/admin/newsletter?${params.toString()}`
  }, [search, lang])

  return (
    <div className="flex flex-col gap-5">
      {/* Stats header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t('statTotal')} value={stats?.total ?? 0} />
        <StatCard label="FR" value={stats?.byLang.fr ?? 0} />
        <StatCard label="ES" value={stats?.byLang.es ?? 0} />
        <StatCard label="EN" value={stats?.byLang.en ?? 0} />
      </div>

      {/* Filters + Export */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full h-10 pl-9 pr-3 rounded-md border border-sand-300 bg-sand-50 text-[14px] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-[3px] focus-visible:ring-clay-700/15 transition-colors"
          />
        </div>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as typeof lang)}
          className="h-10 px-3 rounded-md border border-sand-300 bg-sand-50 text-[14px] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-[3px] focus-visible:ring-clay-700/15 transition-colors"
        >
          <option value="all">{t('allLangs')}</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md text-[12.5px] font-medium bg-clay-700 hover:bg-accent-hover text-on-accent transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          {t('exportCsv')}
        </button>
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
          <div className="py-16 text-center text-ink-500">
            {t('emptySearch')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="bg-sand-100 text-left text-[11px] uppercase tracking-[0.12em] text-ink-500 font-semibold border-b border-sand-300">
                  <th className="px-4 py-3">{t('colEmail')}</th>
                  <th className="px-4 py-3">{t('colLang')}</th>
                  <th className="px-4 py-3">{t('colSubscribed')}</th>
                  <th className="px-4 py-3">{t('colConfirmed')}</th>
                  <th className="px-4 py-3 text-right">{t('colAction')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-sand-200 last:border-b-0 hover:bg-sand-50 transition-colors"
                  >
                    <td className="px-4 py-3 align-top">
                      <a
                        href={`mailto:${r.email}`}
                        className="text-ink-900 hover:text-clay-700 break-all"
                      >
                        {r.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] uppercase tracking-wider bg-sand-200 text-ink-700 font-mono font-semibold">
                        {r.lang}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-ink-700">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3 align-top text-ink-700">
                      {r.confirmed_at ? (
                        formatDate(r.confirmed_at)
                      ) : (
                        <span className="text-ink-500 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        disabled={deletingId === r.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11.5px] font-semibold uppercase tracking-wider text-brick-600 hover:bg-brick-600/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === r.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        {t('deleteBtn')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rows.length === LIMIT && (
        <p className="text-[12.5px] text-ink-500 italic">
          {t('limitHint', { limit: LIMIT })}
        </p>
      )}
    </div>
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
    <div className="bg-sand-50 border border-sand-300 rounded-md px-4 py-3">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-500 font-semibold mb-1">
        {label}
      </div>
      <div className="font-serif text-[26px] text-ink-900 leading-none">{value}</div>
    </div>
  )
}
