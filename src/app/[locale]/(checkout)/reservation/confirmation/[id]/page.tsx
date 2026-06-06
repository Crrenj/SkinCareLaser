import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getShopSettings } from '@/lib/getShopSettings'
import ConfirmationClient from './ConfirmationClient'

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
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect(`/${locale}/login?next=/reservation/confirmation/${id}`)
  }

  const { data: reservation } = await supabase
    .from('reservations')
    .select(
      'id, user_id, contact_name, contact_phone, total_items, total_price, currency, status, created_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (!reservation || reservation.user_id !== session.user.id) {
    redirect(`/${locale}/account/profile`)
  }

  const { data: items } = await supabase
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
