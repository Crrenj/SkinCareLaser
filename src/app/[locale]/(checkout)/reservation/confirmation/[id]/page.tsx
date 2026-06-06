import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getShopSettings } from '@/lib/getShopSettings'
import ConfirmationClient from './ConfirmationClient'

const RESERVATION_SELECT =
  'id, user_id, contact_name, contact_phone, total_items, total_price, currency, status, created_at'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Reservation' })
  return {
    title: t('successTitle'),
    description: t('successDescription'),
    robots: { index: false, follow: false },
  }
}

export const dynamic = 'force-dynamic'

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { locale, id } = await params
  const { t: token } = await searchParams
  const supabase = await createSupabaseServerClient()
  // getUser() valide le JWT côté serveur (vs getSession() qui lit le cookie). [C-30]
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Résolution de la réservation + du client de lecture des items :
  //  - Connecté : via RLS (auth.uid() = user_id).
  //  - Invité : via le confirmation_token non-devinable (service-role, anti-IDOR).
  type ReservationRow = {
    id: string
    user_id: string | null
    contact_name: string | null
    contact_phone: string | null
    total_items: number
    total_price: number
    currency: string
    status: string
    created_at: string | null
  }
  let reservation: ReservationRow | null = null

  if (user) {
    const { data } = await supabase
      .from('reservations')
      .select(RESERVATION_SELECT)
      .eq('id', id)
      .maybeSingle()
    if (!data || (data as ReservationRow).user_id !== user.id) {
      redirect(`/${locale}/account/profile`)
    }
    reservation = data as ReservationRow
  } else if (token && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('reservations')
      .select(RESERVATION_SELECT)
      .eq('id', id)
      .eq('confirmation_token', token)
      .maybeSingle()
    if (!data) notFound()
    reservation = data as ReservationRow
  } else {
    redirect(`/${locale}/login?next=/reservation/confirmation/${id}`)
  }

  const itemsClient = user ? supabase : supabaseAdmin!
  const { data: items } = await itemsClient
    .from('reservation_items')
    .select(
      `
      id,
      product_id,
      product_name,
      unit_price,
      quantity,
      products (
        product_images (url, alt),
        range:ranges ( brand:brands (name) )
      )
    `,
    )
    .eq('reservation_id', reservation.id)
    .order('created_at', { ascending: true })

  const settings = await getShopSettings()
  const pickup = {
    id: 'santiago' as const,
    name: settings.pickup_name ?? 'Farmacia FARMAU',
    address: settings.pickup_address ?? '',
    hours: settings.pickup_hours ?? '',
    phone: settings.pickup_phone ?? settings.contact_phone ?? '',
  }

  const enrichedItems = (items ?? []).map((row) => {
    const item = row as unknown as {
      id: string
      product_id: string | null
      product_name: string
      unit_price: number
      quantity: number
      products?: {
        product_images?: Array<{ url: string; alt: string | null }>
        range?: { brand?: { name?: string | null } | null } | null
      } | null
    }
    const brandName = item.products?.range?.brand?.name ?? null
    const image = item.products?.product_images?.[0]?.url ?? null
    return {
      id: item.id,
      productId: item.product_id,
      name: item.product_name,
      brand: brandName,
      image,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
    }
  })

  return (
    <ConfirmationClient
      reservationId={reservation.id}
      contactName={reservation.contact_name ?? ''}
      contactPhone={reservation.contact_phone ?? ''}
      totalPrice={Number(reservation.total_price ?? 0)}
      createdAt={reservation.created_at ?? null}
      items={enrichedItems}
      pickupLocation={pickup}
      whatsappNumber={settings.whatsapp_number ?? ''}
      pharmacyPhone={settings.contact_phone ?? ''}
      pharmacyEmail={settings.contact_email ?? ''}
    />
  )
}
