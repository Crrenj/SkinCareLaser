import { logger } from '@/lib/logger'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { buildReservationReference } from '@/lib/reservation'

export const dynamic = 'force-dynamic'

type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'collected'
  | 'expired'
  | 'cancelled'

type ReservationRow = {
  id: string
  total_items: number
  total_price: number | string
  currency: string
  status: ReservationStatus
  created_at: string
  expires_at: string | null
  reservation_items: { product_name: string; quantity: number }[] | null
}

const STATUS_STYLE: Record<ReservationStatus, string> = {
  pending: 'bg-clay-50 text-clay-700 border-clay-200',
  confirmed: 'bg-olive-50 text-olive-700 border-olive-200',
  collected: 'bg-ink-100 text-ink-800 border-ink-200',
  expired: 'bg-sand-200 text-ink-500 border-sand-300',
  cancelled: 'bg-brick-50 text-brick-600 border-brick-200',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Account.reservations' })
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    robots: { index: false, follow: false },
  }
}

// Référence FAR-YYYYMMDD-XXXX — factorisée dans @/lib/reservation.

export default async function AccountReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Account.reservations')
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('reservations')
    .select(
      'id, total_items, total_price, currency, status, created_at, expires_at, reservation_items ( product_name, quantity )',
    )
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .returns<ReservationRow[]>()

  if (error) {
    logger.error('[account/reservations] fetch error:', error)
  }

  const reservations = data ?? []

  return (
    <div>
      <header className="mb-8 pb-6 border-b border-sand-300">
        <h1 className="font-serif text-[32px] lg:text-[40px] leading-[1.05] -tracking-[0.01em] text-ink-900 mb-2">
          {t('heading')}
        </h1>
        <p className="text-[14.5px] text-ink-700">
          {t('subtitle', { count: reservations.length })}
        </p>
      </header>

      {reservations.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-4">
          {reservations.map((r) => (
            <ReservationCard key={r.id} reservation={r} />
          ))}
        </ul>
      )}
    </div>
  )
}

async function EmptyState() {
  const t = await getTranslations('Account.reservations')
  return (
    <div className="bg-white border border-sand-300 rounded-md py-16 px-6 text-center">
      <p className="font-serif italic text-[20px] text-ink-700 max-w-md mx-auto mb-6">
        {t('emptyTitle')}
      </p>
      <p className="text-[14px] text-ink-500 mb-8 max-w-md mx-auto">
        {t('emptyDescription')}
      </p>
      <Link
        href="/catalogue"
        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-sm bg-clay-700 text-on-accent text-[12.5px] font-semibold uppercase tracking-wider hover:bg-accent-hover transition-colors"
      >
        {t('emptyCta')}
      </Link>
    </div>
  )
}

async function ReservationCard({ reservation }: { reservation: ReservationRow }) {
  const t = await getTranslations('Account.reservations')
  const tStatus = await getTranslations('Account.reservations.status')
  const reference = buildReservationReference(reservation.id, reservation.created_at)
  const itemsPreview = (reservation.reservation_items ?? []).slice(0, 3)
  const remainingItems = Math.max(
    (reservation.reservation_items?.length ?? 0) - itemsPreview.length,
    0,
  )
  const formatter = new Intl.NumberFormat('es-DO')
  const dateFmt = new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const createdAt = dateFmt.format(new Date(reservation.created_at))
  const isActive = reservation.status === 'pending' || reservation.status === 'confirmed'

  return (
    <li className="bg-white border border-sand-300 rounded-md p-5 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pb-4 border-b border-sand-200">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500 mb-1">
            {reference}
          </div>
          <p className="text-[13px] text-ink-500">{createdAt}</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-semibold uppercase tracking-wider border ${STATUS_STYLE[reservation.status]}`}
        >
          {tStatus(reservation.status)}
        </span>
      </div>

      <ul className="text-[14px] text-ink-800 mb-4 space-y-1.5">
        {itemsPreview.map((item, idx) => (
          <li key={`${reservation.id}-${idx}`} className="flex justify-between gap-3">
            <span className="truncate">
              <span className="text-ink-500 mr-2">{item.quantity}×</span>
              {item.product_name}
            </span>
          </li>
        ))}
        {remainingItems > 0 && (
          <li className="text-[13px] text-ink-500 italic">
            {t('itemsMore', { count: remainingItems })}
          </li>
        )}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-sand-200">
        <div className="font-serif text-[20px] text-ink-900">
          {formatter.format(Number(reservation.total_price))}{' '}
          <span className="text-[13px] text-ink-500 font-sans align-baseline">
            {reservation.currency}
          </span>
        </div>
        {isActive && (
          <Link
            href={`/reservation/confirmation/${reservation.id}` as `/reservation/confirmation/${string}`}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-wider text-clay-700 hover:text-clay-800 transition-colors"
          >
            {t('viewDetail')}
            <ArrowRight size={14} strokeWidth={1.8} />
          </Link>
        )}
      </div>
    </li>
  )
}
