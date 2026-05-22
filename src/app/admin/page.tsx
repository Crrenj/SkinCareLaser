import type { Metadata } from 'next'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { RevenueWidget, type DailyPoint } from '@/components/admin/dashboard/RevenueWidget'
import {
  LowStockWidget,
  type LowStockItem,
} from '@/components/admin/dashboard/LowStockWidget'
import {
  TopProductsWidget,
  type TopProductRow,
} from '@/components/admin/dashboard/TopProductsWidget'
import {
  RecentReservationsWidget,
  type ReservationRow,
} from '@/components/admin/dashboard/RecentReservationsWidget'
import {
  RecentMessagesWidget,
  type MessageRow,
} from '@/components/admin/dashboard/RecentMessagesWidget'
import type { ReservationStatus } from '@/components/admin/dashboard/StatusBadge'

export const metadata: Metadata = {
  title: 'Vista general · Admin · FARMAU',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'
export const revalidate = 300

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function buildReference(id: string): string {
  const idPart = id.replace(/-/g, '').slice(0, 4).toUpperCase()
  // Le widget affiche la version compacte ; la référence complète
  // (FAR-YYYYMMDD-XXXX) est calculée côté détail réservation.
  return `FAR-…${idPart}`
}

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

  // Buckets vides pour les 14 jours
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

  return {
    previous: ordered.slice(0, 7),
    current: ordered.slice(7, 14),
  }
}

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
  return (data as Array<{
    id: string
    name: string
    stock: number | null
    volume: string | null
    range?: { brand?: { name?: string | null } | null } | null
  }>).map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.range?.brand?.name ?? null,
    volume: p.volume ?? null,
    stock: p.stock ?? 0,
  }))
}

async function fetchTopProducts(): Promise<TopProductRow[]> {
  if (!supabaseAdmin) return []
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString()

  // Récupère les items des réservations non annulées des 30 derniers jours.
  // On agrège côté Node — volumes raisonnables pour un dashboard.
  const { data, error } = await supabaseAdmin
    .from('reservation_items')
    .select(
      `product_id, product_name, quantity, unit_price,
       reservations!inner (status, created_at),
       products ( range:ranges ( brand:brands (name) ) )`,
    )
    .gte('reservations.created_at', thirtyDaysAgo)
    .neq('reservations.status', 'cancelled')

  if (error || !data) return []

  type Row = {
    product_id: string | null
    product_name: string
    quantity: number
    unit_price: number | string
    products?: {
      range?: { brand?: { name?: string | null } | null } | null
    } | null
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

async function fetchRecentReservations(): Promise<ReservationRow[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('id, contact_name, status, total_price, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  if (error || !data) return []
  return (data as Array<{
    id: string
    contact_name: string | null
    status: string
    total_price: number | string
    created_at: string
  }>).map((r) => ({
    id: r.id,
    reference: buildReference(r.id),
    contactName: r.contact_name ?? '',
    status: (r.status as ReservationStatus) ?? 'pending',
    totalPrice: Number(r.total_price ?? 0),
    whatsappOpened: false,
  }))
}

async function fetchRecentMessages(): Promise<MessageRow[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('contact_messages')
    .select('id, user_email, subject, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  if (error || !data) return []
  return (data as Array<{
    id: string
    user_email: string
    subject: string
    message: string
    status: string | null
    created_at: string | null
  }>).map((m) => ({
    id: m.id,
    from: m.user_email.split('@')[0],
    subject: m.subject,
    preview: m.message,
    createdAt: m.created_at ?? new Date().toISOString(),
    unread: m.status === 'unread',
  }))
}

function todayLabel(): string {
  return new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

export default async function AdminDashboardPage() {
  const [revenue, lowStock, topProducts, recentReservations, recentMessages] =
    await Promise.all([
      fetchRevenue(),
      fetchLowStock(),
      fetchTopProducts(),
      fetchRecentReservations(),
      fetchRecentMessages(),
    ])

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Vista general' },
        ]}
        title={`Vista general · ${todayLabel()}`}
        actions={
          <>
            <Link
              href="/admin/product?new=1"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] border border-sand-300 bg-transparent text-ink-700 hover:bg-sand-100 hover:text-ink-900 transition-colors no-underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir producto
            </Link>
            <Link
              href="/admin/product"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-[13px] font-medium bg-clay-700 text-sand-50 hover:bg-clay-800 transition-colors no-underline"
            >
              <Search className="w-3.5 h-3.5" />
              Buscar
            </Link>
          </>
        }
      />

      <div className="bg-sand-100 px-5 lg:px-8 py-6 lg:py-7">
        <div className="grid grid-cols-12 gap-4 lg:gap-5 max-w-[1240px] mx-auto">
          <RevenueWidget current={revenue.current} previous={revenue.previous} />
          <LowStockWidget items={lowStock} />
          <TopProductsWidget rows={topProducts} />
          <RecentReservationsWidget rows={recentReservations} />
          <RecentMessagesWidget rows={recentMessages} />
        </div>
      </div>
    </>
  )
}
