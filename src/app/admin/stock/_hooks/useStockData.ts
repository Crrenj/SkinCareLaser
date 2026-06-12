'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import type {
  InitInventoryPayload,
  SortColumn,
  SortOrder,
  StockEntryPayload,
  StockItem,
  StockLossPayload,
  StockStats,
} from '../_lib/types'

/** Lignes par page de la table stock (pagination côté client : l'API renvoie
 *  tout le référentiel, on ne pagine que le RENDU — les KPIs et les onglets
 *  de statut continuent de compter l'ensemble). */
const STOCK_PAGE_SIZE = 20

export function useStockData() {
  const tCommon = useTranslations('Admin.common')
  const tStock = useTranslations('Admin.stock')
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [stats, setStats] = useState<StockStats>({ total: 0, ok: 0, low: 0, out: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortColumn, setSortColumn] = useState<SortColumn>('product_name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [page, setPage] = useState(1)

  // Tout changement de recherche/filtre/tri ramène à la première page.
  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterStatus, sortColumn, sortOrder])

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
      logger.error('Erreur récupération stock:', error)
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
      logger.error('Erreur sauvegarde stock:', error)
      toast.error(tCommon('saveError'))
      return false
    }
  }

  const recordStockEntry = async (payload: StockEntryPayload): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/stock/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('entry_failed')
      await fetchStockData()
      toast.success(tStock('entrySaved'))
      return true
    } catch (error) {
      logger.error('Erreur entrée de stock:', error)
      toast.error(tStock('entryError'))
      return false
    }
  }

  const recordStockLoss = async (payload: StockLossPayload): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/stock/loss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('loss_failed')
      await fetchStockData()
      toast.success(tStock('loss.saved'))
      return true
    } catch (error) {
      logger.error('Erreur merma:', error)
      toast.error(tStock('loss.error'))
      return false
    }
  }

  /**
   * Écran unifié « Initialiser l'inventaire » (L-2, lancement) — orchestre
   * séquentiellement les back-ends EXISTANTS :
   *   1. stock — coût renseigné → RÉCEPTION (/stock/entry : CMP + 606,
   *      ADDITIONNE) ; coût vide → AJUSTE (/stock PUT : valeur ABSOLUE) ;
   *   2. prix de vente → PATCH produit (champ price seul) ;
   *   3. activation → route dédiée /products/[id]/active (barrière L-3).
   * Le coût ne s'écrit JAMAIS directement (toujours via une réception).
   * Throw en cas d'échec d'étape → le drawer reste ouvert.
   */
  const initInventory = async (payload: InitInventoryPayload): Promise<void> => {
    try {
      if (payload.unit_cost != null && payload.quantity > 0) {
        const response = await fetch('/api/admin/stock/entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_token: payload.client_token,
            items: [
              {
                product_id: payload.product_id,
                quantity: payload.quantity,
                unit_cost: payload.unit_cost,
                itbis_included: true,
              },
            ],
          }),
        })
        if (!response.ok) throw new Error('init_stock_failed')
      } else if (payload.unit_cost == null) {
        // Ajuste : écrase le stock à la quantité comptée (y compris 0 — le
        // drawer affiche explicitement « stock fixé à N » avant validation).
        const response = await fetch('/api/admin/stock', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: payload.product_id, stock: payload.quantity }),
        })
        if (!response.ok) throw new Error('init_stock_failed')
      }
      // coût renseigné mais quantité 0 : rien à recevoir, on saute l'étape stock.

      if (payload.price != null) {
        const response = await fetch(`/api/admin/products/${payload.product_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: payload.price }),
        })
        if (!response.ok) throw new Error('init_price_failed')
      }

      if (payload.activate) {
        const response = await fetch(`/api/admin/products/${payload.product_id}/active`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: true }),
        })
        if (!response.ok) throw new Error('init_activate_failed')
      }

      await fetchStockData()
      toast.success(tStock('init.saved'))
    } catch (error) {
      logger.error("Erreur initialisation d'inventaire:", error)
      toast.error(tStock('init.error'))
      throw error
    }
  }

  // Pagination dérivée — `safePage` se clampe tout seul si la liste rétrécit
  // (filtre plus strict, re-fetch) pour ne jamais pointer une page vide.
  const totalPages = Math.max(1, Math.ceil(stockItems.length / STOCK_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedItems = stockItems.slice((safePage - 1) * STOCK_PAGE_SIZE, safePage * STOCK_PAGE_SIZE)

  // Resynchronise l'état brut après clampage : sans ça, une page périmée
  // (ex. 3 alors qu'il n'en reste 2 après une mutation) « ressusciterait »
  // silencieusement si la liste regrossit ensuite.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return {
    stockItems, pagedItems, stats, loading,
    page: safePage, totalPages, setPage,
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    sortColumn, sortOrder, handleSort,
    updateStock,
    recordStockEntry,
    recordStockLoss,
    initInventory,
  }
}
