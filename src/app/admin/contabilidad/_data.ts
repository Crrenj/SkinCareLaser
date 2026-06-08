import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Agrégation comptable (read-only, Node) pour /admin/contabilidad. Consomme le
// coût capturé par la brique « entrées de stock » : COGS = Σ(unit_cost·qty) sur
// les ventes collected, marge = revenu − COGS. Espagnol en dur (convention des
// widgets dashboard). Aucune migration.
//
// HONNÊTETÉ sur le coût inconnu : une ligne sans unit_cost (vente antérieure à
// la 1re entrée de stock, ou ligne libre) est EXCLUE du COGS et de la marge —
// jamais traitée comme coût 0 (sinon marge 100 % fictive). On expose plutôt une
// « cobertura de coste » = part du CA dont le coût est connu.

const ITBIS_RATE = 0.18

export type ChannelKey = 'account' | 'guest' | 'counter'

export type AccountingPeriod = {
  totalRevenue: number
  costedRevenue: number // CA des seules lignes à coût connu
  cogs: number
  grossMargin: number // costedRevenue − cogs
  marginPct: number // grossMargin / costedRevenue
  coveragePct: number // costedRevenue / totalRevenue
  totalUnits: number
  salesCount: number // nb de ventes (réservations collected distinctes)
  byChannel: Record<ChannelKey, { revenue: number; count: number }>
}

export type ProductMargin = {
  productId: string | null
  name: string
  units: number
  revenue: number
  cogs: number
  marginPct: number | null // null si aucun coût connu sur ce produit
}

export type InventoryValuation = {
  units: number
  retailValue: number
  costValue: number
  productsActive: number
  productsWithCost: number
}

export type PurchasesSummary = {
  total: number // TTC
  taxBase: number // base imposable
  itbis: number // ITBIS estimé
  entries: number // nb de lignes stock_entries
  units: number
  withoutNcf: number // lignes sans NCF (à compléter pour le 606)
  topSuppliers: { name: string; total: number }[]
}

export type ExpenseRow = {
  id: string
  amount: number
  category: string
  label: string | null
  expense_date: string
  note: string | null
}

export type ExpensesSummary = {
  total: number
  byCategory: { category: string; amount: number }[]
  list: ExpenseRow[]
}

export type AccountingData = {
  month: string // 'YYYY-MM'
  monthLabel: string // 'junio de 2026'
  current: AccountingPeriod
  previous: AccountingPeriod
  topMargin: ProductMargin[]
  lowMargin: ProductMargin[]
  inventory: InventoryValuation
  purchases: PurchasesSummary
  gastos: ExpensesSummary
  netResult: number // Ingresos − COGS − Gastos
}

const CHANNELS: ChannelKey[] = ['counter', 'guest', 'account']

function emptyPeriod(): AccountingPeriod {
  return {
    totalRevenue: 0,
    costedRevenue: 0,
    cogs: 0,
    grossMargin: 0,
    marginPct: 0,
    coveragePct: 0,
    totalUnits: 0,
    salesCount: 0,
    byChannel: {
      counter: { revenue: 0, count: 0 },
      guest: { revenue: 0, count: 0 },
      account: { revenue: 0, count: 0 },
    },
  }
}

/** Borne [début, fin[ d'un mois UTC à partir de 'YYYY-MM' (défaut : mois courant). */
export function monthBounds(month?: string): {
  month: string
  start: Date
  end: Date
  prevStart: Date
} {
  const now = new Date()
  let y = now.getUTCFullYear()
  let m = now.getUTCMonth() // 0-based
  const match = month && /^\d{4}-\d{2}$/.test(month) ? month.split('-') : null
  if (match) {
    y = Number(match[0])
    m = Number(match[1]) - 1
  }
  const start = new Date(Date.UTC(y, m, 1))
  const end = new Date(Date.UTC(y, m + 1, 1))
  const prevStart = new Date(Date.UTC(y, m - 1, 1))
  const key = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`
  return { month: key, start, end, prevStart }
}

function num(v: number | string | null | undefined): number {
  return Number(v ?? 0)
}

function finalizePeriod(p: AccountingPeriod): AccountingPeriod {
  p.grossMargin = p.costedRevenue - p.cogs
  p.marginPct = p.costedRevenue > 0 ? p.grossMargin / p.costedRevenue : 0
  p.coveragePct = p.totalRevenue > 0 ? p.costedRevenue / p.totalRevenue : 0
  return p
}

export async function getAccountingData(month?: string): Promise<AccountingData> {
  const { month: monthKey, start, end, prevStart } = monthBounds(month)
  const monthLabel = new Intl.DateTimeFormat('es-DO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(start)

  if (!supabaseAdmin) {
    return {
      month: monthKey,
      monthLabel,
      current: finalizePeriod(emptyPeriod()),
      previous: finalizePeriod(emptyPeriod()),
      topMargin: [],
      lowMargin: [],
      inventory: { units: 0, retailValue: 0, costValue: 0, productsActive: 0, productsWithCost: 0 },
      purchases: { total: 0, taxBase: 0, itbis: 0, entries: 0, units: 0, withoutNcf: 0, topSuppliers: [] },
      gastos: { total: 0, byCategory: [], list: [] },
      netResult: 0,
    }
  }
  const sb = supabaseAdmin

  const [salesRes, invRes, purchRes, expRes] = await Promise.all([
    // Lignes vendues (collected) sur mois courant + précédent. L'embed
    // reservations sert au filtre ET fournit collected_at/source.
    sb
      .from('reservation_items')
      .select(
        'reservation_id, product_id, product_name, quantity, unit_price, unit_cost, reservations!inner(collected_at, source, status)',
      )
      .eq('reservations.status', 'collected')
      .gte('reservations.collected_at', prevStart.toISOString())
      .lt('reservations.collected_at', end.toISOString()),
    // Inventaire valorisé (snapshot courant, hors période).
    sb.from('products').select('stock, price, cost_price').eq('is_active', true),
    // Achats du mois (606) depuis stock_entries.
    sb
      .from('stock_entries')
      .select('quantity, unit_cost, itbis_included, supplier_name, ncf')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString()),
    // Dépenses du mois (P&L).
    sb
      .from('expenses')
      .select('id, amount, category, label, expense_date, note')
      .gte('expense_date', start.toISOString().slice(0, 10))
      .lt('expense_date', end.toISOString().slice(0, 10))
      .order('expense_date', { ascending: false }),
  ])

  // ── Ventes → périodes + marges par produit (mois courant) ──
  const current = emptyPeriod()
  const previous = emptyPeriod()
  const curResSeen = new Set<string>()
  const prevResSeen = new Set<string>()
  const curChannelRes: Record<ChannelKey, Set<string>> = {
    counter: new Set(),
    guest: new Set(),
    account: new Set(),
  }
  const prevChannelRes: Record<ChannelKey, Set<string>> = {
    counter: new Set(),
    guest: new Set(),
    account: new Set(),
  }
  const productAgg = new Map<
    string,
    { productId: string | null; name: string; units: number; revenue: number; cogs: number; costedRevenue: number }
  >()

  type SalesRow = {
    reservation_id: string
    product_id: string | null
    product_name: string
    quantity: number
    unit_price: number | string | null
    unit_cost: number | string | null
    reservations:
      | { collected_at: string | null; source: string | null }
      | { collected_at: string | null; source: string | null }[]
      | null
  }

  for (const row of (salesRes.data ?? []) as SalesRow[]) {
    const resv = Array.isArray(row.reservations) ? row.reservations[0] : row.reservations
    if (!resv?.collected_at) continue
    const t = new Date(resv.collected_at).getTime()
    const isCurrent = t >= start.getTime() && t < end.getTime()
    const period = isCurrent ? current : previous
    const seen = isCurrent ? curResSeen : prevResSeen
    const channelRes = isCurrent ? curChannelRes : prevChannelRes

    const channel: ChannelKey =
      resv.source === 'counter' || resv.source === 'guest' ? resv.source : 'account'
    const qty = row.quantity
    const revenue = num(row.unit_price) * qty
    const hasCost = row.unit_cost !== null && row.unit_cost !== undefined
    const lineCogs = hasCost ? num(row.unit_cost) * qty : 0

    period.totalRevenue += revenue
    period.totalUnits += qty
    period.byChannel[channel].revenue += revenue
    if (hasCost) {
      period.costedRevenue += revenue
      period.cogs += lineCogs
    }
    seen.add(row.reservation_id)
    channelRes[channel].add(row.reservation_id)

    // Marges par produit : mois courant uniquement.
    if (isCurrent) {
      const key = row.product_id ?? `name:${row.product_name}`
      const cur = productAgg.get(key) ?? {
        productId: row.product_id,
        name: row.product_name,
        units: 0,
        revenue: 0,
        cogs: 0,
        costedRevenue: 0,
      }
      cur.units += qty
      cur.revenue += revenue
      if (hasCost) {
        cur.cogs += lineCogs
        cur.costedRevenue += revenue
      }
      productAgg.set(key, cur)
    }
  }

  current.salesCount = curResSeen.size
  previous.salesCount = prevResSeen.size
  for (const c of CHANNELS) {
    current.byChannel[c].count = curChannelRes[c].size
    previous.byChannel[c].count = prevChannelRes[c].size
  }
  finalizePeriod(current)
  finalizePeriod(previous)

  // Produits à coût connu → marge % ; tri top / faible.
  const products: ProductMargin[] = [...productAgg.values()].map((p) => ({
    productId: p.productId,
    name: p.name,
    units: p.units,
    revenue: p.revenue,
    cogs: p.cogs,
    marginPct: p.costedRevenue > 0 ? (p.costedRevenue - p.cogs) / p.costedRevenue : null,
  }))
  const costed = products.filter((p) => p.marginPct !== null)
  const topMargin = [...costed]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
  const lowMargin = [...costed]
    .sort((a, b) => (a.marginPct ?? 0) - (b.marginPct ?? 0))
    .slice(0, 5)

  // ── Inventaire valorisé ──
  const invRows = (invRes.data ?? []) as Array<{
    stock: number | null
    price: number | string | null
    cost_price: number | string | null
  }>
  const inventory: InventoryValuation = {
    units: 0,
    retailValue: 0,
    costValue: 0,
    productsActive: invRows.length,
    productsWithCost: 0,
  }
  for (const p of invRows) {
    const s = p.stock ?? 0
    inventory.units += s
    inventory.retailValue += num(p.price) * s
    if (p.cost_price !== null && p.cost_price !== undefined) {
      inventory.costValue += num(p.cost_price) * s
      inventory.productsWithCost += 1
    }
  }

  // ── Achats du mois (606) ──
  const purchRows = (purchRes.data ?? []) as Array<{
    quantity: number
    unit_cost: number | string | null
    itbis_included: boolean | null
    supplier_name: string | null
    ncf: string | null
  }>
  const purchases: PurchasesSummary = {
    total: 0,
    taxBase: 0,
    itbis: 0,
    entries: purchRows.length,
    units: 0,
    withoutNcf: 0,
    topSuppliers: [],
  }
  const supplierAgg = new Map<string, number>()
  for (const e of purchRows) {
    const lineTotal = num(e.unit_cost) * e.quantity
    purchases.total += lineTotal
    purchases.units += e.quantity
    // ITBIS inclus → base = total / 1.18 ; sinon (exonéré) base = total.
    const base = e.itbis_included === false ? lineTotal : lineTotal / (1 + ITBIS_RATE)
    purchases.taxBase += base
    purchases.itbis += lineTotal - base
    if (!e.ncf || e.ncf.trim() === '') purchases.withoutNcf += 1
    const sup = e.supplier_name?.trim() || 'Sin proveedor'
    supplierAgg.set(sup, (supplierAgg.get(sup) ?? 0) + lineTotal)
  }
  purchases.topSuppliers = [...supplierAgg.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // ── Dépenses du mois → compte de résultat ──
  const expRows = (expRes.data ?? []) as Array<{
    id: string
    amount: number | string
    category: string
    label: string | null
    expense_date: string
    note: string | null
  }>
  const catAgg = new Map<string, number>()
  let gastosTotal = 0
  const expList: ExpenseRow[] = expRows.map((e) => {
    const amt = num(e.amount)
    gastosTotal += amt
    catAgg.set(e.category, (catAgg.get(e.category) ?? 0) + amt)
    return {
      id: e.id,
      amount: amt,
      category: e.category,
      label: e.label,
      expense_date: e.expense_date,
      note: e.note,
    }
  })
  const gastos: ExpensesSummary = {
    total: gastosTotal,
    byCategory: [...catAgg.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
    list: expList,
  }
  // P&L : Ingresos − COGS − Gastos. (COGS partiel si cobertura < 100 %.)
  const netResult = current.totalRevenue - current.cogs - gastosTotal

  return {
    month: monthKey,
    monthLabel,
    current,
    previous,
    topMargin,
    lowMargin,
    inventory,
    purchases,
    gastos,
    netResult,
  }
}

/** Liste 'YYYY-MM' des `count` derniers mois (courant inclus) pour le sélecteur. */
export function recentMonths(count = 12): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < count; i += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const label = new Intl.DateTimeFormat('es-DO', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(d)
    out.push({ value, label })
  }
  return out
}
