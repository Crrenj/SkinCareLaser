import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import nextDynamic from 'next/dynamic'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

const ReservationClient = nextDynamic(() => import('./ReservationClient'), {
  loading: () => (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-4">
      <div className="h-8 w-48 rounded bg-sand-200 animate-pulse" />
      <div className="h-64 w-full rounded bg-sand-200 animate-pulse" />
    </div>
  ),
})

export const dynamic = 'force-dynamic'

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

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createSupabaseServerClient()

  // getUser() valide le JWT côté serveur (vs getSession() qui lit le cookie). [C-30]
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login?next=/reservation`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.phone) {
    redirect(`/${locale}/account/profile?required=phone&from=/reservation`)
  }

  return (
    <ReservationClient
      initialProfile={{
        firstName: profile?.first_name ?? '',
        lastName: profile?.last_name ?? '',
        phone: profile?.phone ?? '',
        email: user.email ?? '',
      }}
    />
  )
}
