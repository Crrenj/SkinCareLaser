import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
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

  // Charge la réservation pour valider l'appartenance + récupérer le snapshot
  const { data: reservation } = await supabase
    .from('reservations')
    .select(
      'id, user_id, contact_name, contact_phone, total_price, currency, status, created_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (!reservation || reservation.user_id !== session.user.id) {
    redirect(`/${locale}/account/profile`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-sand-100">
      <NavBar />
      <main id="main-content" className="flex-grow">
        <ConfirmationClient
          reservationId={reservation.id}
          contactName={reservation.contact_name ?? ''}
          contactPhone={reservation.contact_phone ?? ''}
          totalPrice={Number(reservation.total_price ?? 0)}
        />
      </main>
      <Footer />
    </div>
  )
}
