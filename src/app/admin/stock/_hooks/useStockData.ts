'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import type { StockItem, StockStats, SortColumn, SortOrder } from '../_lib/types'

export function useStockData() {
  const tCommon = useTranslations('Admin.common')
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [stats, setStats] = useState<StockStats>({ total: 0, ok: 0, low: 0, out: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortColumn, setSortColumn] = useState<SortColumn>('product_name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const fetchStockData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy: sortColumn === 'product_name' ? 'name' : sortColumn === 'current_stock' ? 'stock' : sortColumn,
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

  const updateStock = async (productId: string, stock: number) => {
    try {
      const response = await fetch('/api/admin/stock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, stock }),
      })
      if (!response.ok) throw new Error('save_failed')
      await fetchStockData()
      return true
    } catch (error) {
      console.error('Erreur sauvegarde stock:', error)
      toast.error(tCommon('saveError'))
      return false
    }
  }

  return {
    stockItems, stats, loading,
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    sortColumn, sortOrder, handleSort,
    updateStock,
  }
}
