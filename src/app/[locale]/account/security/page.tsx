import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Key, Trash2, ShieldCheck } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { SecurityActions } from '@/components/account/SecurityActions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Account.security' })
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    robots: { index: false, follow: false },
  }
}

export default async function AccountSecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Account.security')
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const email = user!.email ?? ''
  const lastSignIn = user!.last_sign_in_at
    ? new Intl.DateTimeFormat('es-DO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(user!.last_sign_in_at))
    : null

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

      <div className="flex flex-col gap-5">
        <section className="bg-white border border-sand-300 rounded-md p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-sm bg-sand-100 flex items-center justify-center shrink-0">
              <Key size={18} strokeWidth={1.7} className="text-clay-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-[22px] leading-tight -tracking-[0.01em] text-ink-900 mb-1">
                {t('passwordHeading')}
              </h2>
              <p className="text-[14px] text-ink-700 leading-relaxed">
                {t('passwordDescription')}
              </p>
            </div>
          </div>
          <SecurityActions email={email} />
        </section>

        <section className="bg-white border border-sand-300 rounded-md p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-sm bg-sand-100 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} strokeWidth={1.7} className="text-olive-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-[22px] leading-tight -tracking-[0.01em] text-ink-900 mb-1">
                {t('sessionHeading')}
              </h2>
              <p className="text-[14px] text-ink-700 leading-relaxed mb-3">
                {t('sessionDescription')}
              </p>
              {lastSignIn && (
                <p className="text-[13px] text-ink-500">
                  {t('lastSignIn')} <time>{lastSignIn}</time>
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white border border-brick-200 rounded-md p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-sm bg-brick-50 flex items-center justify-center shrink-0">
              <Trash2 size={18} strokeWidth={1.7} className="text-brick-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-[22px] leading-tight -tracking-[0.01em] text-ink-900 mb-1">
                {t('dangerHeading')}
              </h2>
              <p className="text-[14px] text-ink-700 leading-relaxed mb-3">
                {t('dangerDescription')}
              </p>
            </div>
          </div>
          <a
            href={`mailto:contact@farmau.do?subject=${encodeURIComponent(
              `[FARMAU] Suppression du compte ${email}`,
            )}&body=${encodeURIComponent(
              `Bonjour,\n\nJe souhaite supprimer mon compte FARMAU associé à l'adresse ${email}, conformément à mon droit à l'oubli (Ley 172-13 RD).\n\nMerci de bien vouloir confirmer la suppression.\n\nCordialement,`,
            )}`}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-sm bg-brick-600 hover:bg-brick-700 text-white text-[12.5px] font-semibold uppercase tracking-wider transition-colors"
          >
            <Trash2 size={15} strokeWidth={1.8} />
            {t('dangerCta')}
          </a>
        </section>
      </div>
    </div>
  )
}
