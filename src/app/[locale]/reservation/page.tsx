import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ReservationClient from './ReservationClient'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Reservation' })
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    robots: { index: false, follow: false },
  }
}

export const dynamic = 'force-dynamic'

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect(`/${locale}/login?next=/reservation`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone')
    .eq('id', session.user.id)
    .maybeSingle()

  if (!profile?.phone) {
    redirect(`/${locale}/account/profile?required=phone&from=/reservation`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-sand-100">
      <NavBar />
      <main id="main-content" className="flex-grow">
        <ReservationClient
          initialProfile={{
            firstName: profile?.first_name ?? '',
            lastName: profile?.last_name ?? '',
            phone: profile?.phone ?? '',
            email: session.user.email ?? '',
          }}
        />
      </main>
      <Footer />
    </div>
  )
}
