import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { buildReservationReferenceCompact } from '@/lib/reservation'
import type { DailyPoint } from '@/components/admin/dashboard/RevenueWidget'
import type { LowStockItem } from '@/components/admin/dashboard/LowStockWidget'
import type { TopProductRow } from '@/components/admin/dashboard/TopProductsWidget'
import type { ReservationRow } from '@/components/admin/dashboard/RecentReservationsWidget'
import type { MessageRow } from '@/components/admin/dashboard/RecentMessagesWidget'
import type { ReservationStatus } from '@/components/admin/dashboard/StatusBadge'
import type { CatalogueReadiness } from '@/components/admin/dashboard/CatalogueReadinessWidget'
import type { InventoryStats } from '@/components/admin/dashboard/InventoryWidget'
import type { BrandBar } from '@/components/admin/dashboard/BrandBreakdownWidget'
import type { ReservationStatusStats } from '@/components/admin/dashboard/ReservationStatusWidget'
import type { CustomerStats } from '@/components/admin/dashboard/CustomersWidget'
import type { EngagementStats } from '@/components/admin/dashboard/EngagementWidget'
import type { ContentStats } from '@/components/admin/dashboard/ContentWidget'

// ────────────────────────────────────────────────────────────────────────────
// Données du tableau de bord admin. Les AGRÉGATS (chiffres, sommes, group-by)
// sont calculés EN BASE par la RPC service-role `get_dashboard_stats()` (un seul
// aller-retour), au lieu de ramener des tables entières dans Node pour les
// agréger en JS — cf. migration 20260611190000_dashboard_stats_rpc.sql. Seules
// les LISTES de lignes ordonnées (stock critique, top produits, réservations /
// messages récents) restent des requêtes PostgREST distinctes : elles ont
// besoin d'embeds marque ou de lignes triées. Total : 5 requêtes par chargement
// (1 RPC + 4 listes), contre ~28 auparavant.
//
// ⚠️ get_dashboard_stats agrège products.cost_price (valorisation au coût) :
// elle est verrouillée service-role et n'est appelable que via supabaseAdmin.
// ────────────────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000

const EMPTY_RESERVATION_STATUS: ReservationStatusStats = {
  byStatus: {
    pending: { n: 0, revenue: 0, items: 0 },
    confirmed: { n: 0, revenue: 0, items: 0 },
    collected: { n: 0, revenue: 0, items: 0 },
    expired: { n: 0, revenue: 0, items: 0 },
    cancelled: { n: 0, revenue: 0, items: 0 },
  },
  totalReservations: 0,
  activeCount: 0,
  confirmedRevenue: 0,
  avgBasket: 0,
}

const EMPTY_CATALOGUE: {
  readiness: CatalogueReadiness
  inventory: InventoryStats
  brandBars: BrandBar[]
} = {
  readiness: {
    score: 0,
    activeProducts: 0,
    brands: 0,
    ranges: 0,
    featured: 0,
    isNew: 0,
    promo: 0,
    metrics: [],
  },
  inventory: {
    units: 0,
    stockValue: 0,
    activeProducts: 0,
    placeholderPriced: 0,
    distribution: { inStock: 0, low: 0, oos: 0 },
  },
  brandBars: [],
}

const EMPTY_CUSTOMERS: CustomerStats = {
  total: 0,
  withPhone: 0,
  new7d: 0,
  new30d: 0,
  byLocale: [],
}

const EMPTY_ENGAGEMENT: EngagementStats = {
  activeCarts: 0,
  totalCarts: 0,
  cartUnits: 0,
  userCarts: 0,
  wishlists: 0,
  wishlistProducts: 0,
  newsletter: 0,
  newsletterConfirmed: 0,
}

const EMPTY_CONTENT: ContentStats = {
  posts: 0,
  postsPublished: 0,
  banners: 0,
  bannersActive: 0,
  tags: 0,
  tagTypes: 0,
  productTags: 0,
}

// ───────────────────────── Agrégats SQL (RPC) ─────────────────────────

// Forme brute du jsonb renvoyé par get_dashboard_stats(). Les valeurs numériques
// arrivent déjà en Number (jsonb → JSON.parse) ; on borne le typage défensivement.
type DashboardStatsRaw = {
  revenue: { current: DailyPoint[]; previous: DailyPoint[] }
  inventory: {
    productsActive: number
    units: number
    retailValue: number
    costValue: number
    productsWithCost: number
    placeholderPriced: number
    inStock: number
    low: number
    oos: number
  }
  readiness: CatalogueReadiness
  brandBars: BrandBar[]
  reservationStatus: ReservationStatusStats
  customers: CustomerStats
  engagement: EngagementStats
  content: ContentStats
  inbox: { total: number; unread: number }
}

type DashboardStats = {
  revenue: { current: DailyPoint[]; previous: DailyPoint[] }
  readiness: CatalogueReadiness
  inventory: InventoryStats
  brandBars: BrandBar[]
  reservationStatus: ReservationStatusStats
  customers: CustomerStats
  engagement: EngagementStats
  content: ContentStats
  inbox: { unread: number; total: number }
}

function emptyStats(): DashboardStats {
  return {
    revenue: { current: [], previous: [] },
    readiness: EMPTY_CATALOGUE.readiness,
    inventory: EMPTY_CATALOGUE.inventory,
    brandBars: EMPTY_CATALOGUE.brandBars,
    reservationStatus: EMPTY_RESERVATION_STATUS,
    customers: EMPTY_CUSTOMERS,
    engagement: EMPTY_ENGAGEMENT,
    content: EMPTY_CONTENT,
    inbox: { unread: 0, total: 0 },
  }
}

/**
 * Tous les agrégats du dashboard en UN appel RPC (service-role). On remappe la
 * forme SQL vers les shapes des widgets (InventoryStats remappe inventory.* ;
 * inbox.total/unread inversés). En cas d'erreur/null → zéros gracieux.
 */
async function fetchStats(): Promise<DashboardStats> {
  if (!supabaseAdmin) return emptyStats()

  const { data, error } = await supabaseAdmin.rpc('get_dashboard_stats')
  if (error || !data) return emptyStats()

  const raw = data as DashboardStatsRaw

  return {
    revenue: {
      current: raw.revenue?.current ?? [],
      previous: raw.revenue?.previous ?? [],
    },
    readiness: raw.readiness ?? EMPTY_CATALOGUE.readiness,
    inventory: {
      units: raw.inventory?.units ?? 0,
      stockValue: raw.inventory?.retailValue ?? 0,
      activeProducts: raw.inventory?.productsActive ?? 0,
      placeholderPriced: raw.inventory?.placeholderPriced ?? 0,
      distribution: {
        inStock: raw.inventory?.inStock ?? 0,
        low: raw.inventory?.low ?? 0,
        oos: raw.inventory?.oos ?? 0,
      },
    },
    brandBars: raw.brandBars ?? [],
    reservationStatus: raw.reservationStatus ?? EMPTY_RESERVATION_STATUS,
    customers: raw.customers ?? EMPTY_CUSTOMERS,
    engagement: raw.engagement ?? EMPTY_ENGAGEMENT,
    content: raw.content ?? EMPTY_CONTENT,
    inbox: {
      unread: raw.inbox?.unread ?? 0,
      total: raw.inbox?.total ?? 0,
    },
  }
}

// ───────────────────────── Stock crítico (liste) ─────────────────────────

async function fetchLowStock(): Promise<LowStockItem[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(
      `id, name, stock, volume,
       range:ranges ( brand:brands (name) )`,
    )
    .eq('is_active', true)
    .lt('stock', 5)
    .order('stock', { ascending: true })
    .limit(5)

  if (error || !data) return []
  return (
    data as Array<{
      id: string
      name: string
      stock: number | null
      volume: string | null
      range?: { brand?: { name?: string | null } | null } | null
    }>
  ).map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.range?.brand?.name ?? null,
    volume: p.volume ?? null,
    stock: p.stock ?? 0,
  }))
}

// ───────────────────────── Top productos (30 j, liste) ─────────────────────

async function fetchTopProducts(): Promise<TopProductRow[]> {
  if (!supabaseAdmin) return []
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString()

  const { data, error } = await supabaseAdmin
    .from('reservation_items')
    .select(
      `product_id, product_name, quantity, unit_price,
       reservations!inner (status, collected_at),
       products ( range:ranges ( brand:brands (name) ) )`,
    )
    // « Vendu » = réservation collected (= retirée), fenêtre sur collected_at.
    // Cohérent avec v_bestsellers.sold_30d (ne compte plus les intentions pending).
    .eq('reservations.status', 'collected')
    .gte('reservations.collected_at', thirtyDaysAgo)

  if (error || !data) return []

  type Row = {
    product_id: string | null
    product_name: string
    quantity: number
    unit_price: number | string
    products?: { range?: { brand?: { name?: string | null } | null } | null } | null
  }

  const agg = new Map<
    string,
    { productId: string | null; name: string; brand: string | null; units: number; total: number }
  >()
  for (const row of data as Row[]) {
    const key = row.product_id ?? row.product_name
    const cur = agg.get(key) ?? {
      productId: row.product_id,
      name: row.product_name,
      brand: row.products?.range?.brand?.name ?? null,
      units: 0,
      total: 0,
    }
    cur.units += row.quantity
    cur.total += Number(row.unit_price) * row.quantity
    agg.set(key, cur)
  }
  return [...agg.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, 4)
    .map((r) => ({
      productId: r.productId,
      name: r.name,
      brand: r.brand,
      units: r.units,
      totalDop: r.total,
    }))
}

// ───────────────────────── Reservas recientes (liste) ─────────────────────

async function fetchRecentReservations(): Promise<ReservationRow[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('id, contact_name, status, total_price, created_at, source')
    .order('created_at', { ascending: false })
    .limit(5)
  if (error || !data) return []
  return (
    data as Array<{
      id: string
      contact_name: string | null
      status: string
      total_price: number | string
      created_at: string
      source: string | null
    }>
  ).map((r) => ({
    id: r.id,
    reference: buildReservationReferenceCompact(r.id),
    contactName: r.contact_name ?? '',
    source: r.source ?? 'account',
    status: (r.status as ReservationStatus) ?? 'pending',
    totalPrice: Number(r.total_price ?? 0),
    whatsappOpened: false,
  }))
}

// ───────────────────────── Mensajes recientes (liste) ─────────────────────

async function fetchRecentMessages(): Promise<MessageRow[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('contact_messages')
    .select('id, user_email, subject, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  if (error || !data) return []
  return (
    data as Array<{
      id: string
      user_email: string
      subject: string
      message: string
      status: string | null
      created_at: string | null
    }>
  ).map((m) => ({
    id: m.id,
    from: m.user_email.split('@')[0],
    subject: m.subject,
    preview: m.message,
    createdAt: m.created_at ?? new Date().toISOString(),
    unread: m.status === 'open',
  }))
}

// ───────────────────────── Agrégat ─────────────────────────

export type DashboardData = {
  revenue: { current: DailyPoint[]; previous: DailyPoint[] }
  lowStock: LowStockItem[]
  topProducts: TopProductRow[]
  recentReservations: ReservationRow[]
  recentMessages: MessageRow[]
  readiness: CatalogueReadiness
  inventory: InventoryStats
  brandBars: BrandBar[]
  reservationStatus: ReservationStatusStats
  customers: CustomerStats
  engagement: EngagementStats
  content: ContentStats
  inbox: { unread: number; total: number }
}

/** Charge toutes les données du dashboard en parallèle (1 RPC + 4 listes). */
export async function getDashboardData(): Promise<DashboardData> {
  const [stats, lowStock, topProducts, recentReservations, recentMessages] = await Promise.all([
    fetchStats(),
    fetchLowStock(),
    fetchTopProducts(),
    fetchRecentReservations(),
    fetchRecentMessages(),
  ])

  return {
    revenue: stats.revenue,
    lowStock,
    topProducts,
    recentReservations,
    recentMessages,
    readiness: stats.readiness,
    inventory: stats.inventory,
    brandBars: stats.brandBars,
    reservationStatus: stats.reservationStatus,
    customers: stats.customers,
    engagement: stats.engagement,
    content: stats.content,
    inbox: stats.inbox,
  }
}
