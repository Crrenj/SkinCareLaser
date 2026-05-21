import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import ProfileEditForm from '@/components/ProfileEditForm'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.profile' })
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
  }
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ required?: string; from?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Profile')
  const supabase = await createSupabaseServerClient()

  // La session est garantie par le layout /account ; on récupère juste l'user.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, display_name, phone, birth_date')
    .eq('id', user!.id)
    .maybeSingle()

  if (error) {
    console.error('[profile] fetch error:', error)
  }

  const { required, from } = await searchParams
  const phoneRequired = required === 'phone'

  const safeProfile = profile ?? {
    id: user!.id,
    first_name: null,
    last_name: null,
    display_name: null,
    phone: null,
    birth_date: null,
  }

  return (
    <div className="max-w-2xl">
      <header className="mb-8 pb-6 border-b border-sand-300">
        <h1 className="font-serif text-[32px] lg:text-[40px] leading-[1.05] -tracking-[0.01em] text-ink-900 mb-2">
          {t('pageTitle')}
        </h1>
        <p className="text-[14.5px] text-ink-700 leading-relaxed">{t('pageDescription')}</p>
      </header>

      {phoneRequired && (
        <div
          role="alert"
          className="mb-6 bg-clay-50 border-l-4 border-clay-700 p-4 rounded"
        >
          <p className="font-medium text-ink-900">{t('phoneRequiredTitle')}</p>
          <p className="text-sm text-ink-700 mt-1">{t('phoneRequiredDescription')}</p>
        </div>
      )}

      <ProfileEditForm
        profile={safeProfile}
        userEmail={user!.email ?? ''}
        redirectTo={from}
      />
    </div>
  )
}
