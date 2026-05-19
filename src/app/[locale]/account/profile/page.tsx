import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ProfileEditForm from '@/components/ProfileEditForm'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

// User-scoped page, never cacher
export const dynamic = 'force-dynamic'

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
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect(
      `/${locale}/login?redirectedFrom=${encodeURIComponent(`/${locale}/account/profile`)}`,
    )
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, display_name, phone, birth_date')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) {
    console.error('[profile] fetch error:', error)
  }

  const { required, from } = await searchParams
  const phoneRequired = required === 'phone'

  // Fallback profile shape si la row n'existe pas (devrait pas arriver
  // grâce au trigger handle_new_user mais défensif)
  const safeProfile = profile ?? {
    id: session.user.id,
    first_name: null,
    last_name: null,
    display_name: null,
    phone: null,
    birth_date: null,
  }

  return (
    <div className="flex flex-col min-h-screen bg-sand-200">
      <NavBar />
      <main id="main-content" className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-ink-900 mb-2">{t('pageTitle')}</h1>
          <p className="text-ink-700 mb-8">{t('pageDescription')}</p>

          {phoneRequired && (
            <div
              role="alert"
              className="mb-6 bg-clay-50 border-l-4 border-clay-700 p-4 rounded"
            >
              <p className="font-medium text-ink-900">
                {t('phoneRequiredTitle')}
              </p>
              <p className="text-sm text-ink-700 mt-1">
                {t('phoneRequiredDescription')}
              </p>
            </div>
          )}

          <ProfileEditForm
            profile={safeProfile}
            userEmail={session.user.email ?? ''}
            redirectTo={from}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
