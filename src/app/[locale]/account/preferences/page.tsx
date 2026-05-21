import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { PreferencesForm } from '@/components/account/PreferencesForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Account.preferences' })
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    robots: { index: false, follow: false },
  }
}

export default async function AccountPreferencesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Account.preferences')
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_locale')
    .eq('id', user!.id)
    .maybeSingle()

  const raw = profile?.preferred_locale
  const initialPreferredLocale: 'fr' | 'en' | 'es' | null =
    raw === 'fr' || raw === 'en' || raw === 'es' ? raw : null

  return (
    <div className="max-w-2xl">
      <header className="mb-8 pb-6 border-b border-sand-300">
        <h1 className="font-serif text-[32px] lg:text-[40px] leading-[1.05] -tracking-[0.01em] text-ink-900 mb-2">
          {t('heading')}
        </h1>
        <p className="text-[14.5px] text-ink-700 leading-relaxed">
          {t('subtitle')}
        </p>
      </header>

      <PreferencesForm initialPreferredLocale={initialPreferredLocale} />
    </div>
  )
}
