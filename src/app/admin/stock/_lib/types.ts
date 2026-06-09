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
  cost_price: number | null
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

/** Une ligne du drawer d'entrée de stock (réception). */
export interface StockEntryLine {
  product_id: string
  product_name: string
  unit_cost: number
  quantity: number
}

/** Payload POST /api/admin/stock/entry. */
export interface StockEntryPayload {
  client_token: string
  supplier_name?: string
  supplier_rnc?: string
  ncf?: string
  invoice_date?: string
  note?: string
  itbis_included: boolean
  items: { product_id: string; quantity: number; unit_cost: number; itbis_included: boolean }[]
}

/** Payload POST /api/admin/stock/loss (perte de stock / merma). */
export interface StockLossPayload {
  client_token: string
  product_id: string
  quantity: number
  reason: 'vencido' | 'danado' | 'robo' | 'ajuste'
  note?: string
}

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
