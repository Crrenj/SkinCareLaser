'use client'

import { useState } from 'react'
import { Pencil, Search, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { useStockData } from './_hooks/useStockData'
import { STATUS_TABS, type StockItem } from './_lib/types'
import { Kpi, StockPill, ThSort } from './_components/StockHelpers'
import { StockEditModal } from './_components/StockEditModal'

export default function StockPage() {
  const t = useTranslations('Admin.stock')
  const tCrumbs = useTranslations('Admin.crumbs')
  const tCommon = useTranslations('Admin.common')
  const tStockState = useTranslations('Admin.stockState')

  const {
    stockItems, stats, loading,
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    sortColumn, sortOrder, handleSort,
    updateStock,
  } = useStockData()

  const [editingItem, setEditingItem] = useState<StockItem | null>(null)

  return (
    <>
      <PageHeader
        crumbs={[
          { label: tCrumbs('admin'), href: '/admin' },
          { label: tCrumbs('catalog') },
          { label: tCrumbs('stock') },
        ]}
        title={t('title')}
      />

      <div className="bg-sand-100 border-b border-sand-300 px-5 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 sticky top-[88px] z-[4]">
        <label className="flex items-center gap-2 bg-sand-50 border border-sand-300 rounded-md px-3 py-1.5 text-ink-700 min-w-0 flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="sr-only">{tCommon('search')}</span>
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[13.5px] text-ink-900 placeholder:text-ink-500"
          />
        </label>
        <div className="flex gap-1.5 items-center flex-wrap">
          {STATUS_TABS.map((tab) => {
            const active = filterStatus === tab.value
            const count = stats[tab.key]
            const danger = tab.value === 'out'
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilterStatus(tab.value)}
                className={`px-3 py-1.5 text-[12.5px] rounded-full border inline-flex items-center gap-1.5 transition-colors ${
                  active
                    ? danger ? 'bg-brick-600 text-sand-50 border-brick-600 font-medium' : 'bg-ink-900 text-sand-50 border-ink-900 font-medium'
                    : 'bg-sand-50 text-ink-700 border-sand-300 hover:border-sand-500 hover:text-ink-900'
                }`}
              >
                {t(tab.labelKey)}
                <span className={`font-mono text-[10.5px] ${active ? 'opacity-85' : 'opacity-70'}`}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 lg:px-8 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label={t('kpiTotal')} value={stats.total} />
          <Kpi label={t('kpiOk')} value={stats.ok} icon={<CheckCircle2 className="w-4 h-4 text-olive-600" />} accent="olive" />
          <Kpi label={t('kpiLow')} value={stats.low} icon={<AlertTriangle className="w-4 h-4 text-[#B5852B]" />} accent="ochre" />
          <Kpi label={t('kpiOut')} value={stats.out} icon={<XCircle className="w-4 h-4 text-brick-600" />} accent="brick" />
        </div>

        {loading ? (
          <div className="bg-sand-50 border border-sand-300 rounded-xl py-12 text-center text-ink-500 text-[13.5px]">
            <Loader2 className="w-5 h-5 mx-auto mb-3 animate-spin text-clay-700" />
            {tCommon('loading')}
          </div>
        ) : stockItems.length === 0 ? (
          <div className="bg-sand-50 border border-sand-300 rounded-xl py-14 text-center text-ink-500 text-[13.5px]">
            {t('emptyState')}
          </div>
        ) : (
          <div className="bg-sand-50 border border-sand-300 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(31,27,22,0.06),0_12px_32px_-8px_rgba(31,27,22,0.08)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13.5px]">
                <thead className="bg-sand-100 border-b border-sand-300">
                  <tr>
                    <ThSort column="product_name" current={sortColumn} order={sortOrder} onSort={handleSort}>{t('columnProduct')}</ThSort>
                    <ThSort column="current_stock" current={sortColumn} order={sortOrder} onSort={handleSort} align="right">{t('columnStock')}</ThSort>
                    <ThSort column="status" current={sortColumn} order={sortOrder} onSort={handleSort}>{t('columnStatus')}</ThSort>
                    <ThSort column="last_updated" current={sortColumn} order={sortOrder} onSort={handleSort}>{t('columnUpdated')}</ThSort>
                    <th className="w-[60px]" />
                  </tr>
                </thead>
                <tbody>
                  {stockItems.map((item) => {
                    const tint = item.status === 'low' ? 'bg-[rgba(181,133,43,0.04)]' : item.status === 'out' ? 'bg-[rgba(139,58,46,0.04)]' : ''
                    return (
                      <tr key={item.id} className={`border-b border-sand-200 last:border-b-0 transition-colors hover:bg-sand-100 ${tint}`}>
                        <td className="px-4 py-3 align-middle">
                          <div className="leading-tight">
                            <b className="block text-[13.5px] font-medium text-ink-900">{item.product_name}</b>
                            {item.brand_name && <small className="block text-[11.5px] text-ink-500 font-mono uppercase tracking-[0.04em]">{item.brand_name}</small>}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-right">
                          <span className={`font-mono text-[13px] font-medium whitespace-nowrap ${item.status === 'out' ? 'text-brick-600' : item.status === 'low' ? 'text-[#B5852B]' : 'text-ink-900'}`}>
                            {item.current_stock}
                            <small className="text-ink-500 font-sans text-[10.5px] font-normal ml-1">{tStockState('units')}</small>
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle"><StockPill status={item.status} tStockState={tStockState} /></td>
                        <td className="px-4 py-3 align-middle text-ink-700 text-[12.5px]">
                          {new Date(item.last_updated).toLocaleString('es-DO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              title={t('editTitle')}
                              aria-label={t('editAria', { name: item.product_name })}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-ink-500 hover:bg-sand-200 hover:text-ink-900 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
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
        )}
      </div>

      {editingItem && (
        <StockEditModal
          item={editingItem}
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={updateStock}
        />
      )}
    </>
  )
}
