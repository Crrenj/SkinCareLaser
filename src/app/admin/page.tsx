import type { Metadata } from 'next'
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Mail,
  Plus,
  Search,
  ShoppingCart,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { toLocaleTag } from '@/lib/constants'
import { formatPrice } from '@/lib/formatPrice'
import { getDashboardData } from './_dashboard/data'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { StatCard } from '@/components/admin/dashboard/StatCard'
import { DashboardSectionHeader } from '@/components/admin/dashboard/DashboardSectionHeader'
import { RevenueWidget } from '@/components/admin/dashboard/RevenueWidget'
import { LowStockWidget } from '@/components/admin/dashboard/LowStockWidget'
import { TopProductsWidget } from '@/components/admin/dashboard/TopProductsWidget'
import { RecentReservationsWidget } from '@/components/admin/dashboard/RecentReservationsWidget'
import { RecentMessagesWidget } from '@/components/admin/dashboard/RecentMessagesWidget'
import { CatalogueReadinessWidget } from '@/components/admin/dashboard/CatalogueReadinessWidget'
import { InventoryWidget } from '@/components/admin/dashboard/InventoryWidget'
import { BrandBreakdownWidget } from '@/components/admin/dashboard/BrandBreakdownWidget'
import { ReservationStatusWidget } from '@/components/admin/dashboard/ReservationStatusWidget'
import { CustomersWidget } from '@/components/admin/dashboard/CustomersWidget'
import { EngagementWidget } from '@/components/admin/dashboard/EngagementWidget'
import { ContentWidget } from '@/components/admin/dashboard/ContentWidget'
import { QuickActionsWidget } from '@/components/admin/dashboard/QuickActionsWidget'

export const metadata: Metadata = {
  title: 'Vista general · Admin · FARMAU',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'
export const revalidate = 300

function todayLabel(locale: string): string {
  return new Intl.DateTimeFormat(toLocaleTag(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

const fmt0 = (n: number) => formatPrice(n, { fractionDigits: 0 })

export default async function AdminDashboardPage() {
  const [d, locale, tCrumbs, tCommon, tProduct] = await Promise.all([
    getDashboardData(),
    getLocale(),
    getTranslations('Admin.crumbs'),
    getTranslations('Admin.common'),
    getTranslations('Admin.product'),
  ])

  const lowCritical = d.inventory.distribution.low + d.inventory.distribution.oos

  return (
    <>
      <PageHeader
        crumbs={[{ label: tCrumbs('admin'), href: '/admin' }, { label: tCrumbs('dashboard') }]}
        title={`${tCrumbs('dashboard')} · ${todayLabel(locale)}`}
        actions={
          <>
            <Link
              href="/admin/product?new=1"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] border border-sand-300 bg-transparent text-ink-700 hover:bg-sand-100 hover:text-ink-900 transition-colors no-underline"
            >
              <Plus className="w-3.5 h-3.5" />
              {tProduct('addButton')}
            </Link>
            <Link
              href="/admin/product"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-[13px] font-medium bg-clay-700 text-on-accent hover:bg-clay-800 transition-colors no-underline"
            >
              <Search className="w-3.5 h-3.5" />
              {tCommon('search')}
            </Link>
          </>
        }
      />

      <div className="bg-sand-100 px-5 lg:px-8 py-6 lg:py-7">
        <div className="max-w-[1240px] mx-auto flex flex-col gap-7 lg:gap-9">
          {/* ───────── Pulse : tout d'un coup d'œil ───────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              label="Productos activos"
              value={String(d.readiness.activeProducts)}
              sub={`${d.readiness.brands} marcas · ${d.readiness.ranges} gamas`}
              icon={Boxes}
              accent="ink"
              href="/admin/product"
            />
            <StatCard
              label="Reservas activas"
              value={String(d.reservationStatus.activeCount)}
              sub={`${fmt0(d.reservationStatus.confirmedRevenue)} DOP confirmado`}
              icon={ClipboardList}
              accent="clay"
              href="/admin/reservations"
            />
            <StatCard
              label="Stock crítico"
              value={String(lowCritical)}
              sub={`${d.inventory.distribution.oos} agotados · < 5 uds`}
              icon={AlertTriangle}
              accent={lowCritical > 0 ? 'brick' : 'olive'}
              alert={lowCritical > 0}
              href="/admin/stock"
            />
            <StatCard
              label="Mensajes sin leer"
              value={String(d.inbox.unread)}
              sub={`${d.inbox.total} en total`}
              icon={Mail}
              accent={d.inbox.unread > 0 ? 'clay' : 'olive'}
              alert={d.inbox.unread > 0}
              href="/admin/messages"
            />
            <StatCard
              label="Clientes"
              value={String(d.customers.total)}
              sub={`+${d.customers.new7d} esta semana`}
              icon={Users}
              accent="ink"
              href="/admin/users"
            />
            <StatCard
              label="Carritos activos"
              value={String(d.engagement.activeCarts)}
              sub={`${d.engagement.cartUnits} uds en curso`}
              icon={ShoppingCart}
              accent="ink"
            />
          </div>

          {/* ───────── 01 · Reservas e ingresos ───────── */}
          <section className="flex flex-col gap-4">
            <DashboardSectionHeader
              index="01"
              title="Reservas e ingresos"
              description="Click & collect · últimos 7 días"
            />
            <div className="grid grid-cols-12 gap-4 lg:gap-5">
              <RevenueWidget
                current={d.revenue.current}
                previous={d.revenue.previous}
                className="col-span-12 lg:col-span-8"
              />
              <ReservationStatusWidget
                data={d.reservationStatus}
                className="col-span-12 lg:col-span-4"
              />
              <RecentReservationsWidget rows={d.recentReservations} className="col-span-12" />
            </div>
          </section>

          {/* ───────── 02 · Catálogo e inventario ───────── */}
          <section className="flex flex-col gap-4">
            <DashboardSectionHeader
              index="02"
              title="Catálogo e inventario"
              description={`${d.readiness.activeProducts} productos · ${d.readiness.brands} marcas`}
            />
            <div className="grid grid-cols-12 gap-4 lg:gap-5">
              <CatalogueReadinessWidget data={d.readiness} className="col-span-12 lg:col-span-7" />
              <InventoryWidget data={d.inventory} className="col-span-12 lg:col-span-5" />
              <BrandBreakdownWidget bars={d.brandBars} className="col-span-12" />
              <TopProductsWidget rows={d.topProducts} className="col-span-12 md:col-span-6" />
              <LowStockWidget items={d.lowStock} className="col-span-12 md:col-span-6" />
            </div>
          </section>

          {/* ───────── 03 · Clientes y actividad ───────── */}
          <section className="flex flex-col gap-4">
            <DashboardSectionHeader
              index="03"
              title="Clientes y actividad"
              description="Cuentas, carritos y bandeja"
            />
            <div className="grid grid-cols-12 gap-4 lg:gap-5">
              <CustomersWidget
                data={d.customers}
                className="col-span-12 md:col-span-6 lg:col-span-4"
              />
              <EngagementWidget
                data={d.engagement}
                className="col-span-12 md:col-span-6 lg:col-span-4"
              />
              <ContentWidget data={d.content} className="col-span-12 lg:col-span-4" />
              <RecentMessagesWidget rows={d.recentMessages} className="col-span-12" />
            </div>
          </section>

          {/* ───────── Atajos ───────── */}
          <div className="grid grid-cols-12 gap-4 lg:gap-5">
            <QuickActionsWidget className="col-span-12" />
          </div>
        </div>
      </div>
    </>
  )
}
