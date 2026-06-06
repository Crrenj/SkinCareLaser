'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { fmtDOP, type Reservation } from '../reservations/types'

/** Date de référence d'une vente = retrait (collected_at), repli création. */
function saleDate(r: Reservation): Date {
  return new Date(r.collected_at ?? r.created_at)
}

/**
 * Bandeau chiffre d'affaires du journal des ventes. Agrégé côté client à
 * partir des lignes retirées (toutes origines confondues). Fenêtres : jour
 * courant + mois courant (basées sur collected_at).
 */
export function SalesSummary({ rows }: { rows: Reservation[] }) {
  const t = useTranslations('Admin.sales.summary')

  const stats = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    let revenueToday = 0
    let revenueMonth = 0
    let countMonth = 0

    for (const r of rows) {
      const ts = saleDate(r).getTime()
      if (ts >= startOfToday) revenueToday += r.total_price
      if (ts >= startOfMonth) {
        revenueMonth += r.total_price
        countMonth += 1
      }
    }

    const avgBasket = countMonth > 0 ? revenueMonth / countMonth : 0
    return { revenueToday, revenueMonth, countMonth, avgBasket }
  }, [rows])

  const cards = [
    { label: t('today'), value: `${fmtDOP(stats.revenueToday, 0)}`, suffix: DEFAULT_CURRENCY },
    { label: t('month'), value: `${fmtDOP(stats.revenueMonth, 0)}`, suffix: DEFAULT_CURRENCY },
    { label: t('count'), value: String(stats.countMonth), suffix: '' },
    { label: t('avgBasket'), value: `${fmtDOP(stats.avgBasket, 0)}`, suffix: DEFAULT_CURRENCY },
  ]

  return (
    <div className="px-5 lg:px-8 pt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-sand-50 border border-sand-300 rounded-xl px-4 py-3.5">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-500 m-0">
            {c.label}
          </p>
          <p className="font-serif text-[26px] leading-tight text-ink-900 m-0 mt-1.5">
            {c.value}
            {c.suffix && (
              <span className="font-sans text-[11px] text-ink-500 ml-1 align-middle">
                {c.suffix}
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  )
}
