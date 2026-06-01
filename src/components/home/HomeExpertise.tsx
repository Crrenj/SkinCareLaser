import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Plate } from '@/components/ui/Plate'

/**
 * Manifeste « Une pharmacie, pas un commerce » (`.expertise`) — plaque portrait
 * équipe à gauche, texte signé à droite. Le différenciateur métier de la home.
 */
export async function HomeExpertise() {
  const t = await getTranslations('Home.expertise')

  return (
    <section className="grid lg:grid-cols-[0.85fr_1.15fr] bg-sand-50 border-y border-sand-300">
      <Plate mark className="min-h-[300px] lg:min-h-[420px] border-0 lg:border-r border-sand-300" />

      <div className="px-[clamp(32px,5vw,88px)] py-[clamp(40px,6vw,88px)] flex flex-col justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500 font-medium mb-[22px]">
          {t('eyebrow')}
        </div>
        <h2
          className="font-serif font-normal text-[clamp(34px,4.4vw,58px)] leading-[1.02] -tracking-[0.02em] text-ink-900 text-balance mb-6 [&_em]:italic [&_em]:text-clay-700"
          dangerouslySetInnerHTML={{ __html: t.raw('title') as string }}
        />
        <p className="text-[16px] leading-[1.68] text-ink-800 max-w-[52ch] mb-4">
          {t('p1')}
        </p>
        <p className="text-[16px] leading-[1.68] text-ink-800 max-w-[52ch]">
          {t.rich('p2', {
            strong: (chunks) => <strong className="font-semibold text-ink-900">{chunks}</strong>,
          })}
        </p>
        <Link
          href="/a-propos"
          className="group inline-flex items-center gap-2.5 self-start mt-8 px-5 py-3 rounded-[2px] border border-ink-900 text-ink-900 text-[12.5px] font-semibold uppercase tracking-[0.06em] hover:bg-ink-900 hover:text-sand-50 transition-colors"
        >
          {t('cta')}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
        <p className="font-serif italic text-[17px] text-ink-500 max-w-[52ch] mt-[18px] pt-[18px] border-t border-sand-300">
          {t('signature')}
        </p>
      </div>
    </section>
  )
}
