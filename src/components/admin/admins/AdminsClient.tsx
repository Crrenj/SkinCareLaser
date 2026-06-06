'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  ArrowUpCircle,
  Loader2,
  Lock,
  UserPlus,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

type AdminRole = 'admin' | 'super_admin'

type AdminRow = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  phone: string | null
  role: AdminRole
  createdAt: string
}

type CurrentUser = { id: string; role: AdminRole | null }

type SearchRow = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  isAdmin: boolean
}

export function AdminsClient() {
  const t = useTranslations('Admin.admins')
  const tc = useTranslations('Admin.common')

  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Recherche « ajouter un admin »
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchRow[] | null>(null)
  const [searching, setSearching] = useState(false)

  const isSuper = currentUser?.role === 'super_admin'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/admins')
      if (!res.ok) throw new Error('fetch_failed')
      const data = (await res.json()) as { admins: AdminRow[]; currentUser: CurrentUser }
      setAdmins(data.admins ?? [])
      setCurrentUser(data.currentUser ?? null)
    } catch {
      setError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const mapError = useCallback(
    (code?: string) => {
      switch (code) {
        case 'cannot_modify_self':
          return t('errorCannotModifySelf')
        case 'cannot_modify_super_admin':
          return t('errorCannotModifySuper')
        case 'super_admin_required':
          return t('errorSuperAdminRequired')
        default:
          return t('errorUpdateFailed')
      }
    },
    [t],
  )

  const patchUser = useCallback(
    async (id: string, body: { isAdmin?: boolean; role?: AdminRole }) => {
      setUpdatingId(id)
      try {
        const res = await fetch(`/api/admin/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as { error?: string } | null
          toast.error(mapError(json?.error))
          return false
        }
        return true
      } finally {
        setUpdatingId(null)
      }
    },
    [mapError],
  )

  const runSearch = useCallback(async () => {
    const q = search.trim()
    if (q.length < 2) {
      setSearchResults(null)
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&perPage=50`)
      if (!res.ok) throw new Error('search_failed')
      const data = (await res.json()) as { users: SearchRow[] }
      setSearchResults(data.users ?? [])
    } catch {
      toast.error(t('errorUpdateFailed'))
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [search, t])

  const handleMakeAdmin = useCallback(
    async (row: SearchRow) => {
      const ok = await patchUser(row.id, { isAdmin: true })
      if (ok) {
        toast.success(t('toastAdded', { who: row.email ?? '' }))
        setSearch('')
        setSearchResults(null)
        load()
      }
    },
    [patchUser, t, load],
  )

  const handlePromoteSuper = useCallback(
    async (row: AdminRow) => {
      if (!window.confirm(t('confirmPromoteSuper', { who: row.email ?? '' }))) return
      const ok = await patchUser(row.id, { role: 'super_admin' })
      if (ok) {
        toast.success(t('toastPromotedSuper', { who: row.email ?? '' }))
        load()
      }
    },
    [patchUser, t, load],
  )

  const handleRevoke = useCallback(
    async (row: AdminRow) => {
      if (!window.confirm(t('confirmRevoke', { who: row.email ?? '' }))) return
      const ok = await patchUser(row.id, { isAdmin: false })
      if (ok) {
        toast.success(t('toastRevoked', { who: row.email ?? '' }))
        load()
      }
    },
    [patchUser, t, load],
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label={t('statTotal')} value={admins.length} />
        <StatCard
          label={t('statSuperAdmins')}
          value={admins.filter((a) => a.role === 'super_admin').length}
        />
        <StatCard
          label={t('statAdmins')}
          value={admins.filter((a) => a.role === 'admin').length}
        />
      </div>

      {!isSuper && !loading && (
        <div className="flex items-center gap-2.5 bg-clay-50 border border-clay-200 text-ink-700 rounded-md px-4 py-3 text-[13px]">
          <Lock className="w-4 h-4 shrink-0 text-clay-700" />
          {t('readOnlyNotice')}
        </div>
      )}

      {/* Liste de l'équipe admin */}
      <section>
        <h2 className="font-serif text-[22px] text-ink-900 mb-3">{t('sectionTeam')}</h2>
        <div className="bg-sand-50 border border-sand-300 rounded-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-ink-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {tc('loading')}
            </div>
          ) : error ? (
            <div className="py-16 text-center text-brick-600">{error}</div>
          ) : admins.length === 0 ? (
            <div className="py-16 text-center text-ink-500">{t('empty')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="bg-sand-100 text-left text-[11px] uppercase tracking-[0.12em] text-ink-500 font-semibold border-b border-sand-300">
                    <th className="px-4 py-3">{t('colMember')}</th>
                    <th className="px-4 py-3">{t('colRole')}</th>
                    <th className="px-4 py-3">{t('colSince')}</th>
                    <th className="px-4 py-3 text-right">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => {
                    const isSelf = a.id === currentUser?.id
                    const isSuperRow = a.role === 'super_admin'
                    const canManage = isSuper && !isSuperRow // self est super → déjà couvert
                    const busy = updatingId === a.id
                    return (
                      <tr
                        key={a.id}
                        className="border-b border-sand-200 last:border-b-0 hover:bg-sand-50 transition-colors"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-ink-900 flex items-center gap-2">
                            {formatName(a) || <span className="text-ink-500 italic">—</span>}
                            {isSelf && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-clay-700 bg-clay-50 border border-clay-200 rounded px-1.5 py-0.5">
                                {t('youBadge')}
                              </span>
                            )}
                          </div>
                          <div
                            className="text-[12px] text-ink-500 truncate max-w-[260px]"
                            title={a.email ?? undefined}
                          >
                            {a.email ?? '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <RoleBadge role={a.role} t={t} />
                        </td>
                        <td className="px-4 py-3 align-top text-ink-700">
                          {formatDate(a.createdAt)}
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          {isSuperRow ? (
                            <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-500">
                              <Lock className="w-3 h-3" />
                              {t('protectedHint')}
                            </span>
                          ) : !canManage ? (
                            <span className="text-ink-400">—</span>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handlePromoteSuper(a)}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[11.5px] font-semibold uppercase tracking-wider border border-sand-400 text-ink-700 hover:border-clay-700 hover:text-clay-700 transition-colors disabled:opacity-50"
                                title={t('promoteToSuper')}
                              >
                                {busy ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ArrowUpCircle className="w-3 h-3" />
                                )}
                                {t('promoteToSuper')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRevoke(a)}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[11.5px] font-semibold uppercase tracking-wider border border-sand-400 text-ink-700 hover:border-brick-600 hover:text-brick-600 transition-colors disabled:opacity-50"
                                title={t('revoke')}
                              >
                                <ShieldOff className="w-3 h-3" />
                                {t('revoke')}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Ajouter un admin — super-admin uniquement */}
      {isSuper && (
        <section>
          <h2 className="font-serif text-[22px] text-ink-900 mb-1">{t('addHeading')}</h2>
          <p className="text-[13px] text-ink-500 mb-3">{t('addHint')}</p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              runSearch()
            }}
            className="flex gap-2 max-w-xl"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('addSearchPlaceholder')}
                className="w-full h-10 pl-9 pr-3 rounded-md border border-sand-300 bg-sand-50 text-[14px] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-[3px] focus-visible:ring-clay-700/15 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={searching || search.trim().length < 2}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-clay-700 hover:bg-clay-800 text-on-accent text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {tc('search')}
            </button>
          </form>

          {searchResults !== null && (
            <div className="mt-3 bg-sand-50 border border-sand-300 rounded-md overflow-hidden max-w-xl">
              {searchResults.length === 0 ? (
                <div className="py-8 text-center text-ink-500 text-[13px]">
                  {t('searchNoResults')}
                </div>
              ) : (
                <ul className="divide-y divide-sand-200">
                  {searchResults.map((u) => (
                    <li key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                      <UserPlus className="w-4 h-4 text-ink-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] text-ink-900 truncate">
                          {formatName(u) || u.email || '—'}
                        </div>
                        {formatName(u) && u.email && (
                          <div className="text-[12px] text-ink-500 truncate">{u.email}</div>
                        )}
                      </div>
                      {u.isAdmin ? (
                        <span className="text-[11.5px] text-ink-500 italic shrink-0">
                          {t('alreadyAdmin')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMakeAdmin(u)}
                          disabled={updatingId === u.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11.5px] font-semibold uppercase tracking-wider bg-clay-700 hover:bg-clay-800 text-on-accent disabled:opacity-50 transition-colors shrink-0"
                        >
                          {updatingId === u.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Shield className="w-3 h-3" />
                          )}
                          {t('makeAdmin')}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function RoleBadge({
  role,
  t,
}: {
  role: AdminRole
  t: ReturnType<typeof useTranslations>
}) {
  const isSuper = role === 'super_admin'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
        isSuper ? 'bg-clay-700 text-on-accent' : 'bg-sand-200 text-ink-700'
      }`}
    >
      {isSuper ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
      {isSuper ? t('roleSuperAdmin') : t('roleAdmin')}
    </span>
  )
}

function formatName(r: {
  displayName: string | null
  firstName: string | null
  lastName: string | null
}): string {
  return r.displayName || [r.firstName, r.lastName].filter(Boolean).join(' ') || ''
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
