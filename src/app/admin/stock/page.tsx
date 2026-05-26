'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Pencil,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModalA11y } from '@/hooks/useModalA11y'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'

interface StockItem {
  id: string
  product_id: string
  product_name: string
  current_stock: number
  last_updated: string
  status: 'ok' | 'low' | 'out' | 'excess'
  brand_name?: string
  range_name?: string
  price: number
  currency: string
}

interface StockStats {
  total: number
  ok: number
  low: number
  out: number
}

type SortColumn = 'product_name' | 'current_stock' | 'status' | 'last_updated'
type SortOrder = 'asc' | 'desc'

const STATUS_TABS: Array<{ value: string; label: string; key: keyof StockStats }> = [
  { value: 'all', label: 'Todos', key: 'total' },
  { value: 'ok', label: 'Normal', key: 'ok' },
  { value: 'low', label: 'Bajo', key: 'low' },
  { value: 'out', label: 'Sin stock', key: 'out' },
]

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [stats, setStats] = useState<StockStats>({ total: 0, ok: 0, low: 0, out: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [sortColumn, setSortColumn] = useState<SortColumn>('product_name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const [formData, setFormData] = useState({ product_id: '', current_stock: 0 })

  const dialogRef = useModalA11y(showModal, () => setShowModal(false))

  const fetchStockData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy:
          sortColumn === 'product_name'
            ? 'name'
            : sortColumn === 'current_stock'
              ? 'stock'
              : sortColumn,
        sortOrder,
        status: filterStatus,
      })
      const response = await fetch(`/api/admin/stock?${params}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération')
      const data = await response.json()
      setStockItems(data.items || [])
      setStats(data.stats || { total: 0, ok: 0, low: 0, out: 0 })
    } catch (error) {
      console.error('Erreur récupération stock:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterStatus, sortColumn, sortOrder])

  useEffect(() => {
    fetchStockData()
  }, [fetchStockData])

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

  const openModal = (item: StockItem) => {
    setEditingItem(item)
    setFormData({ product_id: item.product_id, current_stock: item.current_stock })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      const response = await fetch('/api/admin/stock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: editingItem.product_id,
          stock: formData.current_stock,
        }),
      })
      if (!response.ok) throw new Error('Erreur lors de la mise à jour')
      await fetchStockData()
      setShowModal(false)
    } catch (error) {
      console.error('Erreur sauvegarde stock:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Catálogo' },
          { label: 'Stock' },
        ]}
        title="Stock"
      />

      <div className="bg-sand-100 border-b border-sand-300 px-5 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 sticky top-[88px] z-[4]">
        <label className="flex items-center gap-2 bg-sand-50 border border-sand-300 rounded-md px-3 py-1.5 text-ink-700 min-w-0 flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="sr-only">Buscar un producto</span>
          <input
            type="search"
            placeholder="Buscar un producto…"
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
                    ? danger
                      ? 'bg-brick-600 text-sand-50 border-brick-600 font-medium'
                      : 'bg-ink-900 text-sand-50 border-ink-900 font-medium'
                    : 'bg-sand-50 text-ink-700 border-sand-300 hover:border-sand-500 hover:text-ink-900'
                }`}
              >
                {tab.label}
                <span className={`font-mono text-[10.5px] ${active ? 'opacity-85' : 'opacity-70'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 lg:px-8 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label="Total productos" value={stats.total} icon={null} />
          <Kpi label="Stock normal" value={stats.ok} icon={<CheckCircle2 className="w-4 h-4 text-olive-600" />} accent="olive" />
          <Kpi label="Stock bajo" value={stats.low} icon={<AlertTriangle className="w-4 h-4 text-[#B5852B]" />} accent="ochre" />
          <Kpi label="Sin stock" value={stats.out} icon={<XCircle className="w-4 h-4 text-brick-600" />} accent="brick" />
        </div>

        {loading ? (
          <div className="bg-sand-50 border border-sand-300 rounded-xl py-12 text-center text-ink-500 text-[13.5px]">
            <Loader2 className="w-5 h-5 mx-auto mb-3 animate-spin text-clay-700" />
            Cargando…
          </div>
        ) : stockItems.length === 0 ? (
          <div className="bg-sand-50 border border-sand-300 rounded-xl py-14 text-center text-ink-500 text-[13.5px]">
            No hay productos.
          </div>
        ) : (
          <div className="bg-sand-50 border border-sand-300 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(31,27,22,0.06),0_12px_32px_-8px_rgba(31,27,22,0.08)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13.5px]">
                <thead className="bg-sand-100 border-b border-sand-300">
                  <tr>
                    <ThSort column="product_name" current={sortColumn} order={sortOrder} onSort={handleSort}>
                      Producto
                    </ThSort>
                    <ThSort column="current_stock" current={sortColumn} order={sortOrder} onSort={handleSort} align="right">
                      Stock
                    </ThSort>
                    <ThSort column="status" current={sortColumn} order={sortOrder} onSort={handleSort}>
                      Estado
                    </ThSort>
                    <ThSort column="last_updated" current={sortColumn} order={sortOrder} onSort={handleSort}>
                      Actualizado
                    </ThSort>
                    <th className="w-[60px]" />
                  </tr>
                </thead>
                <tbody>
                  {stockItems.map((item) => {
                    const rowTint =
                      item.status === 'low'
                        ? 'bg-[rgba(181,133,43,0.04)]'
                        : item.status === 'out'
                          ? 'bg-[rgba(139,58,46,0.04)]'
                          : ''
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-sand-200 last:border-b-0 transition-colors hover:bg-sand-100 ${rowTint}`}
                      >
                        <td className="px-4 py-3 align-middle">
                          <div className="leading-tight">
                            <b className="block text-[13.5px] font-medium text-ink-900">
                              {item.product_name}
                            </b>
                            {item.brand_name && (
                              <small className="block text-[11.5px] text-ink-500 font-mono uppercase tracking-[0.04em]">
                                {item.brand_name}
                              </small>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-right">
                          <span
                            className={`font-mono text-[13px] font-medium whitespace-nowrap ${
                              item.status === 'out'
                                ? 'text-brick-600'
                                : item.status === 'low'
                                  ? 'text-[#B5852B]'
                                  : 'text-ink-900'
                            }`}
                          >
                            {item.current_stock}
                            <small className="text-ink-500 font-sans text-[10.5px] font-normal ml-1">
                              uds
                            </small>
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <StockPill status={item.status} />
                        </td>
                        <td className="px-4 py-3 align-middle text-ink-700 text-[12.5px]">
                          {new Date(item.last_updated).toLocaleString('es-DO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => openModal(item)}
                              title="Editar stock"
                              aria-label={`Editar stock de ${item.product_name}`}
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

      {showModal && editingItem && (
        <div
          className="fixed inset-0 bg-ink-900/50 overflow-y-auto h-full w-full z-50 flex items-start justify-center px-4 py-12"
          onClick={() => setShowModal(false)}
          aria-hidden="true"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-modal-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-sand-50 border border-sand-300 rounded-xl shadow-[0_24px_60px_-12px_rgba(31,27,22,0.35)] overflow-hidden"
          >
            <header className="px-6 py-5 border-b border-sand-300">
              <h3
                id="stock-modal-title"
                className="font-serif text-[22px] text-ink-900 leading-tight m-0"
              >
                Editar stock
              </h3>
              <p className="text-[12.5px] text-ink-500 mt-1">{editingItem.product_name}</p>
            </header>
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
              <div>
                <label
                  htmlFor="stock-modal-current"
                  className="block text-[11px] tracking-[0.14em] uppercase text-ink-500 font-semibold mb-2"
                >
                  Stock actual
                </label>
                <input
                  id="stock-modal-current"
                  type="number"
                  required
                  min={0}
                  value={formData.current_stock}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      current_stock: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-md font-mono text-[14px] text-ink-900 focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-2 focus-visible:ring-clay-700/20"
                />
              </div>
              <div className="bg-sand-100 border border-sand-300 rounded-md p-3.5 text-[12.5px] text-ink-700 flex flex-col gap-1">
                <span>
                  <b className="text-ink-900 font-medium">Precio:</b> {editingItem.price}{' '}
                  {editingItem.currency.toUpperCase()}
                </span>
                <span>
                  <b className="text-ink-900 font-medium">Marca:</b>{' '}
                  {editingItem.brand_name || 'No especificada'}
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-[13px] text-ink-700 bg-transparent border border-sand-300 rounded-md hover:bg-sand-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-[13px] font-medium text-sand-50 bg-clay-700 rounded-md hover:bg-clay-800 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Kpi({
  label,
  value,
  icon,
  accent = 'clay',
}: {
  label: string
  value: number
  icon?: React.ReactNode
  accent?: 'clay' | 'olive' | 'ochre' | 'brick'
}) {
  const accentClass = {
    clay: 'text-clay-700',
    olive: 'text-olive-600',
    ochre: 'text-[#B5852B]',
    brick: 'text-brick-600',
  }[accent]
  return (
    <div className="bg-sand-50 border border-sand-300 rounded-xl px-5 py-4">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500">
          {label}
        </span>
      </div>
      <span className={`font-serif text-[32px] leading-none ${accentClass}`}>{value}</span>
    </div>
  )
}

function StockPill({ status }: { status: 'ok' | 'low' | 'out' | 'excess' }) {
  const map = {
    ok: { label: 'Normal', bg: 'bg-olive-600/15', text: 'text-olive-600', dot: 'bg-olive-600' },
    low: { label: 'Bajo', bg: 'bg-[rgba(181,133,43,0.15)]', text: 'text-[#7A5A1C]', dot: 'bg-[#B5852B]' },
    out: { label: 'Sin stock', bg: 'bg-brick-600/12', text: 'text-brick-600', dot: 'bg-brick-600' },
    excess: { label: 'Exceso', bg: 'bg-ink-200', text: 'text-ink-800', dot: 'bg-ink-500' },
  } as const
  const s = map[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${s.bg} ${s.text}`}
    >
      <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function ThSort({
  children,
  column,
  current,
  order,
  onSort,
  align = 'left',
}: {
  children: React.ReactNode
  column: SortColumn
  current: SortColumn
  order: SortOrder
  onSort: (col: SortColumn) => void
  align?: 'left' | 'right'
}) {
  const isOn = current === column
  return (
    <th
      className={`text-${align} px-4 py-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap cursor-pointer transition-colors ${
        isOn ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'
      }`}
      onClick={() => onSort(column)}
    >
      {children}
      {isOn && (
        <span className="inline-flex align-middle ml-1 text-clay-700">
          {order === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      )}
    </th>
  )
}
