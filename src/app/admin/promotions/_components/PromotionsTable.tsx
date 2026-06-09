'use client'

import { useTranslations } from 'next-intl'
import { Pencil, Trash2, Percent, BadgeDollarSign } from 'lucide-react'
import type { Promotion } from '../_lib/types'

type Props = {
  promotions: Promotion[]
  onEdit: (promo: Promotion) => void
  onDelete: (promo: Promotion) => void
}

type Status = 'active' | 'scheduled' | 'expired' | 'inactive'

function statusOf(p: Promotion): Status {
  if (!p.is_active) return 'inactive'
  const now = Date.now()
  if (now < new Date(p.start_date).getTime()) return 'scheduled'
  if (now >= new Date(p.end_date).getTime()) return 'expired'
  return 'active'
}

const STATUS_CLS: Record<Status, string> = {
  active: 'bg-olive-100 text-olive-700',
  scheduled: 'bg-sand-200 text-ink-700',
  expired: 'bg-sand-200 text-ink-500',
  inactive: 'bg-brick-50 text-brick-700',
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}

export function PromotionsTable({ promotions, onEdit, onDelete }: Props) {
  const t = useTranslations('Admin.promotions')

  if (promotions.length === 0) {
    return (
      <div className="bg-sand-50 border border-sand-300 rounded-xl py-14 text-center text-ink-500 text-[13.5px]">
        {t('empty')}
      </div>
    )
  }

  return (
    <div className="bg-sand-50 border border-sand-300 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead className="bg-sand-100 border-b border-sand-300">
            <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-500 font-semibold">
              <th className="px-4 py-3">{t('colName')}</th>
              <th className="px-4 py-3">{t('colDiscount')}</th>
              <th className="px-4 py-3">{t('colWindow')}</th>
              <th className="px-4 py-3">{t('colTargets')}</th>
              <th className="px-4 py-3">{t('colStatus')}</th>
              <th className="px-4 py-3 w-[90px]" />
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => {
              const status = statusOf(p)
              return (
                <tr key={p.id} className="border-b border-sand-200 last:border-b-0 hover:bg-sand-100 transition-colors align-top">
                  <td className="px-4 py-3 font-medium text-ink-900">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-mono text-ink-900">
                      {p.discount_type === 'percent' ? (
                        <Percent className="w-3.5 h-3.5 text-clay-700" />
                      ) : (
                        <BadgeDollarSign className="w-3.5 h-3.5 text-clay-700" />
                      )}
                      {p.discount_type === 'percent' ? `${p.discount_value}%` : `${p.discount_value} DOP`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-700 whitespace-nowrap">
                    {fmtDate(p.start_date)} → {fmtDate(p.end_date)}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    <span className="inline-flex flex-wrap gap-1">
                      {p.targets.slice(0, 3).map((tg) => (
                        <span
                          key={`${tg.target_type}:${tg.target_id}`}
                          className="inline-block px-1.5 py-0.5 rounded bg-sand-200 text-[11px] text-ink-700"
                        >
                          {tg.label ?? tg.target_id.slice(0, 6)}
                        </span>
                      ))}
                      {p.targets.length > 3 && (
                        <span className="text-[11px] text-ink-500">+{p.targets.length - 3}</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${STATUS_CLS[status]}`}>
                      {t(`status_${status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        title={t('edit')}
                        aria-label={t('editAria', { name: p.name })}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md text-ink-500 hover:bg-sand-200 hover:text-ink-900 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p)}
                        title={t('delete')}
                        aria-label={t('deleteAria', { name: p.name })}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md text-ink-500 hover:bg-sand-200 hover:text-brick-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
