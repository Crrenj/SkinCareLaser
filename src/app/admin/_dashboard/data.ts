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

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ───────────────────────── Reservas (chart 14 j) ─────────────────────────

async function fetchRevenue(): Promise<{ current: DailyPoint[]; previous: DailyPoint[] }> {
  if (!supabaseAdmin) return { current: [], previous: [] }
  const today = startOfDayUTC(new Date())
  const start = new Date(today.getTime() - 13 * DAY_MS) // 14 jours (current + previous)

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('total_price, status, created_at')
    .gte('created_at', start.toISOString())
    .neq('status', 'cancelled')

  if (error || !data) return { current: [], previous: [] }

  const buckets = new Map<string, { reserved: number; confirmed: number }>()
  for (let i = 0; i < 14; i += 1) {
    const d = new Date(start.getTime() + i * DAY_MS)
    buckets.set(dateKey(d), { reserved: 0, confirmed: 0 })
  }

  for (const row of data as Array<{
    total_price: number | string | null
    status: string | null
    created_at: string | null
  }>) {
    if (!row.created_at) continue
    const k = dateKey(startOfDayUTC(new Date(row.created_at)))
    const bucket = buckets.get(k)
    if (!bucket) continue
    const value = Number(row.total_price ?? 0)
    bucket.reserved += value
    if (row.status === 'confirmed' || row.status === 'collected') {
      bucket.confirmed += value
    }
  }

  const ordered = [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, v]) => ({ date, reserved: v.reserved, confirmed: v.confirmed }))

  return { previous: ordered.slice(0, 7), current: ordered.slice(7, 14) }
}

// ───────────────────────── Stock crítico ─────────────────────────

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

// ───────────────────────── Top productos (30 j) ─────────────────────────

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

// ───────────────────────── Reservas recientes ─────────────────────────

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

// ───────────────────────── Mensajes recientes ─────────────────────────

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

// ───────────────────────── Catálogo (completitud + inventario + marcas) ──

type CatalogueBundle = {
  readiness: CatalogueReadiness
  inventory: InventoryStats
  brandBars: BrandBar[]
}

function emptyCatalogue(): CatalogueBundle {
  return {
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
}

async function fetchCatalogue(): Promise<CatalogueBundle> {
  if (!supabaseAdmin) return emptyCatalogue()
  const sb = supabaseAdmin

  const [productsRes, imagesRes, brandsRes, rangesRes, volRes, inciRes, advRes, pdfRes, benRes] =
    await Promise.all([
      sb.from('products').select('id, is_active, stock, price, range_id, is_featured, is_new, old_price'),
      sb.from('product_images').select('product_id'),
      sb.from('brands').select('id, name'),
      sb.from('ranges').select('id, brand_id'),
      sb.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true).not('volume', 'is', null),
      sb.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true).not('inci', 'is', null),
      sb.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true).not('pharmacist_advice', 'is', null),
      sb.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true).not('technical_pdf_url', 'is', null),
      sb.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true).not('benefits', 'is', null),
    ])

  const products = (productsRes.data ?? []) as Array<{
    id: string
    is_active: boolean | null
    stock: number | null
    price: number | string | null
    range_id: string | null
    is_featured: boolean | null
    is_new: boolean | null
    old_price: number | string | null
  }>
  const imageSet = new Set((imagesRes.data ?? []).map((r) => (r as { product_id: string }).product_id))
  const rangeToBrand = new Map(
    ((rangesRes.data ?? []) as Array<{ id: string; brand_id: string | null }>).map((r) => [
      r.id,
      r.brand_id,
    ]),
  )

  const active = products.filter((p) => p.is_active)
  const activeCount = active.length
  const withImage = active.filter((p) => imageSet.has(p.id)).length

  let units = 0
  let stockValue = 0
  let inStock = 0
  let low = 0
  let oos = 0
  let placeholder = 0
  let featured = 0
  let isNew = 0
  let promo = 0
  const perBrand = new Map<string, { products: number; units: number }>()

  for (const p of active) {
    const s = p.stock ?? 0
    units += s
    stockValue += Number(p.price ?? 0) * s
    if (s === 0) oos += 1
    else if (s < 5) low += 1
    else inStock += 1
    if (Number(p.price) === 100) placeholder += 1
    if (p.is_featured) featured += 1
    if (p.is_new) isNew += 1
    if (p.old_price != null) promo += 1
    const bId = p.range_id ? rangeToBrand.get(p.range_id) ?? undefined : undefined
    if (bId) {
      const e = perBrand.get(bId) ?? { products: 0, units: 0 }
      e.products += 1
      e.units += s
      perBrand.set(bId, e)
    }
  }

  const brandBars: BrandBar[] = ((brandsRes.data ?? []) as Array<{ id: string; name: string }>)
    .map((b) => ({
      name: b.name,
      products: perBrand.get(b.id)?.products ?? 0,
      units: perBrand.get(b.id)?.units ?? 0,
    }))
    .filter((b) => b.products > 0)
    .sort((a, b) => b.products - a.products)

  const metrics = [
    { label: 'Imagen', covered: withImage, total: activeCount },
    { label: 'Precio configurado', covered: activeCount - placeholder, total: activeCount },
    { label: 'Volumen', covered: volRes.count ?? 0, total: activeCount },
    { label: 'Beneficios', covered: benRes.count ?? 0, total: activeCount },
    { label: 'Consejo farmacéutico', covered: advRes.count ?? 0, total: activeCount },
    { label: 'INCI', covered: inciRes.count ?? 0, total: activeCount },
    { label: 'Ficha técnica PDF', covered: pdfRes.count ?? 0, total: activeCount },
  ]
  const score =
    activeCount === 0
      ? 0
      : Math.round(
          (metrics.reduce((a, m) => a + (m.total ? m.covered / m.total : 0), 0) / metrics.length) *
            100,
        )

  return {
    readiness: {
      score,
      activeProducts: activeCount,
      brands: brandBars.length,
      ranges: (rangesRes.data ?? []).length,
      featured,
      isNew,
      promo,
      metrics,
    },
    inventory: {
      units,
      stockValue,
      activeProducts: activeCount,
      placeholderPriced: placeholder,
      distribution: { inStock, low, oos },
    },
    brandBars,
  }
}

// ───────────────────────── Reservas por estado ─────────────────────────

async function fetchReservationStatus(): Promise<ReservationStatusStats> {
  const byStatus: Record<ReservationStatus, { n: number; revenue: number; items: number }> = {
    pending: { n: 0, revenue: 0, items: 0 },
    confirmed: { n: 0, revenue: 0, items: 0 },
    collected: { n: 0, revenue: 0, items: 0 },
    expired: { n: 0, revenue: 0, items: 0 },
    cancelled: { n: 0, revenue: 0, items: 0 },
  }
  const empty: ReservationStatusStats = {
    byStatus,
    totalReservations: 0,
    activeCount: 0,
    confirmedRevenue: 0,
    avgBasket: 0,
  }
  if (!supabaseAdmin) return empty

  const { data } = await supabaseAdmin
    .from('reservations')
    .select('status, total_price, total_items')
  const rows = (data ?? []) as Array<{
    status: ReservationStatus
    total_price: number | string | null
    total_items: number | null
  }>

  let nonCancelledRevenue = 0
  let nonCancelledCount = 0
  for (const r of rows) {
    const bucket = byStatus[r.status]
    if (!bucket) continue
    const rev = Number(r.total_price ?? 0)
    bucket.n += 1
    bucket.revenue += rev
    bucket.items += r.total_items ?? 0
    if (r.status !== 'cancelled') {
      nonCancelledRevenue += rev
      nonCancelledCount += 1
    }
  }

  return {
    byStatus,
    totalReservations: rows.length,
    activeCount: byStatus.pending.n + byStatus.confirmed.n,
    confirmedRevenue: byStatus.confirmed.revenue + byStatus.collected.revenue,
    avgBasket: nonCancelledCount > 0 ? Math.round(nonCancelledRevenue / nonCancelledCount) : 0,
  }
}

// ───────────────────────── Clientes ─────────────────────────

async function fetchCustomers(): Promise<CustomerStats> {
  const empty: CustomerStats = { total: 0, withPhone: 0, new7d: 0, new30d: 0, byLocale: [] }
  if (!supabaseAdmin) return empty

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, phone, preferred_locale, created_at')
  const rows = (data ?? []) as Array<{
    id: string
    phone: string | null
    preferred_locale: string | null
    created_at: string | null
  }>

  const now = Date.now()
  let withPhone = 0
  let new7d = 0
  let new30d = 0
  const localeMap = new Map<string, number>()
  for (const r of rows) {
    if (r.phone && r.phone.trim().length > 0) withPhone += 1
    if (r.created_at) {
      const age = now - new Date(r.created_at).getTime()
      if (age <= 7 * DAY_MS) new7d += 1
      if (age <= 30 * DAY_MS) new30d += 1
    }
    const loc = r.preferred_locale ?? '—'
    localeMap.set(loc, (localeMap.get(loc) ?? 0) + 1)
  }

  return {
    total: rows.length,
    withPhone,
    new7d,
    new30d,
    byLocale: [...localeMap.entries()]
      .map(([locale, n]) => ({ locale, n }))
      .sort((a, b) => b.n - a.n),
  }
}

// ───────────────────────── Engagement (carritos, wishlist, newsletter) ──

async function fetchEngagement(): Promise<EngagementStats> {
  const empty: EngagementStats = {
    activeCarts: 0,
    totalCarts: 0,
    cartUnits: 0,
    userCarts: 0,
    wishlists: 0,
    wishlistProducts: 0,
    newsletter: 0,
    newsletterConfirmed: 0,
  }
  if (!supabaseAdmin) return empty
  const sb = supabaseAdmin

  const [cartsRes, itemsRes, wishRes, nlTotalRes, nlConfRes] = await Promise.all([
    sb.from('carts').select('id, user_id'),
    sb.from('cart_items').select('cart_id, quantity'),
    sb.from('wishlists').select('product_id'),
    sb.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
    sb.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).not('confirmed_at', 'is', null),
  ])

  const carts = (cartsRes.data ?? []) as Array<{ id: string; user_id: string | null }>
  const items = (itemsRes.data ?? []) as Array<{ cart_id: string; quantity: number | null }>
  const wish = (wishRes.data ?? []) as Array<{ product_id: string }>

  return {
    activeCarts: new Set(items.map((i) => i.cart_id)).size,
    totalCarts: carts.length,
    cartUnits: items.reduce((a, i) => a + (i.quantity ?? 0), 0),
    userCarts: carts.filter((c) => c.user_id).length,
    wishlists: wish.length,
    wishlistProducts: new Set(wish.map((w) => w.product_id)).size,
    newsletter: nlTotalRes.count ?? 0,
    newsletterConfirmed: nlConfRes.count ?? 0,
  }
}

// ───────────────────────── Contenido y taxonomía ─────────────────────────

async function fetchContent(): Promise<ContentStats> {
  const empty: ContentStats = {
    posts: 0,
    postsPublished: 0,
    banners: 0,
    bannersActive: 0,
    tags: 0,
    tagTypes: 0,
    productTags: 0,
  }
  if (!supabaseAdmin) return empty
  const sb = supabaseAdmin

  const [postsRes, bannersRes, tagsRes, tagTypesRes, ptRes] = await Promise.all([
    sb.from('posts').select('is_published'),
    sb.from('banners').select('is_active'),
    sb.from('tags').select('*', { count: 'exact', head: true }),
    sb.from('tag_types').select('*', { count: 'exact', head: true }),
    sb.from('product_tags').select('*', { count: 'exact', head: true }),
  ])

  const posts = (postsRes.data ?? []) as Array<{ is_published: boolean | null }>
  const banners = (bannersRes.data ?? []) as Array<{ is_active: boolean | null }>

  return {
    posts: posts.length,
    postsPublished: posts.filter((p) => p.is_published).length,
    banners: banners.length,
    bannersActive: banners.filter((b) => b.is_active).length,
    tags: tagsRes.count ?? 0,
    tagTypes: tagTypesRes.count ?? 0,
    productTags: ptRes.count ?? 0,
  }
}

// ───────────────────────── Bandeja (mensajes) ─────────────────────────

async function fetchInbox(): Promise<{ unread: number; total: number }> {
  if (!supabaseAdmin) return { unread: 0, total: 0 }
  const sb = supabaseAdmin
  const [totalRes, unreadRes] = await Promise.all([
    sb.from('contact_messages').select('*', { count: 'exact', head: true }),
    sb.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])
  return { unread: unreadRes.count ?? 0, total: totalRes.count ?? 0 }
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

/** Charge toutes les données du dashboard en parallèle. */
export async function getDashboardData(): Promise<DashboardData> {
  const [
    revenue,
    lowStock,
    topProducts,
    recentReservations,
    recentMessages,
    catalogue,
    reservationStatus,
    customers,
    engagement,
    content,
    inbox,
  ] = await Promise.all([
    fetchRevenue(),
    fetchLowStock(),
    fetchTopProducts(),
    fetchRecentReservations(),
    fetchRecentMessages(),
    fetchCatalogue(),
    fetchReservationStatus(),
    fetchCustomers(),
    fetchEngagement(),
    fetchContent(),
    fetchInbox(),
  ])

  return {
    revenue,
    lowStock,
    topProducts,
    recentReservations,
    recentMessages,
    readiness: catalogue.readiness,
    inventory: catalogue.inventory,
    brandBars: catalogue.brandBars,
    reservationStatus,
    customers,
    engagement,
    content,
    inbox,
  }
}
