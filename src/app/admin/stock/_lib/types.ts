export interface StockItem {
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

export interface StockStats {
  total: number
  ok: number
  low: number
  out: number
}

export type SortColumn = 'product_name' | 'current_stock' | 'status' | 'last_updated'
export type SortOrder = 'asc' | 'desc'

export const STATUS_TABS: Array<{
  value: string
  labelKey: 'tabsAll' | 'tabsOk' | 'tabsLow' | 'tabsOut'
  key: keyof StockStats
}> = [
  { value: 'all', labelKey: 'tabsAll', key: 'total' },
  { value: 'ok', labelKey: 'tabsOk', key: 'ok' },
  { value: 'low', labelKey: 'tabsLow', key: 'low' },
  { value: 'out', labelKey: 'tabsOut', key: 'out' },
]
