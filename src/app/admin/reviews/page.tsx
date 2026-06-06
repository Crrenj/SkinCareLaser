'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Star, Check, X, Trash2, MessageSquareQuote } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'

type ReviewStatus = 'pending' | 'approved' | 'rejected'
type StatusFilter = 'all' | ReviewStatus

interface AdminReview {
  id: string
  product_id: string
  rating: number
  title: string | null
  body: string | null
  author_name: string | null
  status: ReviewStatus
  verified_purchase: boolean
  created_at: string
  product: { name: string; slug: string | null } | null
}

const FILTERS: { value: StatusFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'filterAll' },
  { value: 'pending', labelKey: 'filterPending' },
  { value: 'approved', labelKey: 'filterApproved' },
  { value: 'rejected', labelKey: 'filterRejected' },
]

export default function ReviewsAdminPage() {
  const t = useTranslations('Admin.reviews')
  const tCrumbs = useTranslations('Admin.crumbs')
  const tCommon = useTranslations('Admin.common')

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = statusFilter === 'all' ? '' : `?status=${statusFilter}`
      const res = await fetch(`/api/admin/reviews${qs}`, { credentials: 'same-origin' })
      if (!res.ok) throw new Error('load_failed')
      const json = (await res.json()) as { reviews: AdminReview[] }
      setReviews(json.reviews ?? [])
    } catch {
      toast.error(t('loadError'))
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, t])

  useEffect(() => {
    load()
  }, [load])

  const moderate = async (id: string, status: ReviewStatus) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'same-origin',
      })
      if (!res.ok) throw new Error()
      toast.success(status === 'approved' ? t('toastApproved') : t('toastRejected'))
      setReviews((prev) =>
        statusFilter === 'all'
          ? prev.map((r) => (r.id === id ? { ...r, status } : r))
          : prev.filter((r) => r.id !== id),
      )
    } catch {
      toast.error(t('toastError'))
    }
  }

  const remove = (id: string) => {
    toast(t('deleteConfirm'), {
      action: {
        label: tCommon('delete'),
        onClick: async () => {
          try {
            const res = await fetch(`/api/admin/reviews/${id}`, {
              method: 'DELETE',
              credentials: 'same-origin',
            })
            if (!res.ok) throw new Error()
            toast.success(t('toastDeleted'))
            setReviews((prev) => prev.filter((r) => r.id !== id))
          } catch {
            toast.error(t('toastError'))
          }
        },
      },
    })
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: tCrumbs('admin'), href: '/admin' },
          { label: tCrumbs('customers') },
          { label: t('title') },
        ]}
        title={t('title')}
      />

      <div className="bg-sand-100 border-b border-sand-300 px-5 lg:px-8 py-3.5 flex items-center gap-1.5 flex-wrap sticky top-[88px] z-[4]">
        {FILTERS.map((f) => {
          const active = statusFilter === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-[12.5px] rounded-full border transition-colors ${
                active
                  ? 'bg-ink-900 text-sand-50 border-ink-900 font-medium'
                  : 'bg-sand-50 text-ink-700 border-sand-300 hover:border-sand-500 hover:text-ink-900'
              }`}
            >
              {t(f.labelKey)}
            </button>
          )
        })}
      </div>

      <div className="px-5 lg:px-8 py-6">
        {loading ? (
          <div className="bg-sand-50 border border-sand-300 rounded-xl py-12 text-center text-ink-500 text-[13.5px]">
            <Loader2 className="w-5 h-5 mx-auto mb-3 animate-spin text-clay-700" />
            {tCommon('loading')}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-sand-50 border border-sand-300 rounded-xl py-14 text-center text-ink-500 text-[13.5px]">
            <MessageSquareQuote className="w-6 h-6 mx-auto mb-3 opacity-50" />
            {t('emptyState')}
          </div>
        ) : (
          <ul className="bg-sand-50 border border-sand-300 rounded-xl overflow-hidden divide-y divide-sand-200 list-none m-0 p-0">
            {reviews.map((r) => (
              <li key={r.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="inline-flex gap-0.5" aria-label={`${r.rating}/5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={13}
                          className={n <= r.rating ? 'text-clay-700 fill-clay-700' : 'text-sand-400'}
                          fill={n <= r.rating ? 'currentColor' : 'none'}
                          aria-hidden
                        />
                      ))}
                    </span>
                    <StatusPill status={r.status} t={t} />
                    {r.verified_purchase && (
                      <span className="text-[11px] text-olive-700 font-medium">· {t('verified')}</span>
                    )}
                  </div>
                  {r.title && <p className="text-[14px] font-semibold text-ink-900 mb-0.5">{r.title}</p>}
                  {r.body && <p className="text-[13px] text-ink-700 line-clamp-3 leading-[1.5]">{r.body}</p>}
                  <div className="flex items-center gap-2 text-[12px] text-ink-500 mt-1.5 flex-wrap font-mono">
                    <span className="truncate max-w-[220px] text-ink-700">{r.product?.name ?? r.product_id}</span>
                    <span>·</span>
                    <span>{r.author_name?.trim() || t('anonymous')}</span>
                    <span>·</span>
                    <span>{new Date(r.created_at).toLocaleDateString('es-DO')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {r.status !== 'approved' && (
                    <IconButton label={t('approve')} onClick={() => moderate(r.id, 'approved')} tone="olive">
                      <Check size={16} />
                    </IconButton>
                  )}
                  {r.status !== 'rejected' && (
                    <IconButton label={t('reject')} onClick={() => moderate(r.id, 'rejected')} tone="ochre">
                      <X size={16} />
                    </IconButton>
                  )}
                  <IconButton label={tCommon('delete')} onClick={() => remove(r.id)} tone="brick">
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function StatusPill({ status, t }: { status: ReviewStatus; t: (k: string) => string }) {
  const map: Record<ReviewStatus, string> = {
    pending: 'bg-clay-50 text-clay-700 border-clay-200',
    approved: 'bg-olive-100 text-olive-700 border-olive-600/30',
    rejected: 'bg-brick-600/10 text-brick-600 border-brick-600/25',
  }
  const labelKey = { pending: 'statusPending', approved: 'statusApproved', rejected: 'statusRejected' }[status]
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${map[status]}`}>{t(labelKey)}</span>
  )
}

function IconButton({
  label,
  onClick,
  tone,
  children,
}: {
  label: string
  onClick: () => void
  tone: 'olive' | 'ochre' | 'brick'
  children: React.ReactNode
}) {
  const toneCls = {
    olive: 'hover:bg-olive-100 hover:text-olive-700',
    ochre: 'hover:bg-sand-200 hover:text-ink-900',
    brick: 'hover:bg-brick-600/10 hover:text-brick-600',
  }[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-8 h-8 flex items-center justify-center rounded-md border border-sand-300 text-ink-700 transition-colors ${toneCls}`}
    >
      {children}
    </button>
  )
}
