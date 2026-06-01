import { getTranslations } from 'next-intl/server'
import { HomeSectionHeader } from './HomeSectionHeader'
import { Plate } from '@/components/ui/Plate'

const STEPS = ['morning', 'evening', 'weekly'] as const

/**
 * Routine en 3 gestes (`.routine`) — chaque étape : gros numéro serif + moment
 * mono sur un filet 2px, titre, texte, et 3 vignettes produit (plaques).
 */
export async function HomeRoutine() {
  const t = await getTranslations('Home.routine')

  return (
    <section className="bg-sand-50 py-[clamp(56px,9vw,128px)]">
      <div className="mx-auto max-w-[1440px] px-[clamp(20px,6vw,104px)]">
        <HomeSectionHeader
          index="03"
          kicker={t('eyebrow')}
          title={t.raw('title') as string}
          ctaLabel={t('seeAll')}
          ctaHref="/a-propos"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[clamp(20px,3vw,40px)]">
          {STEPS.map((key, i) => (
            <article key={key} className="flex flex-col">
              <div className="flex items-baseline gap-3.5 pb-3.5 mb-5 border-b-2 border-ink-900">
                <span className="font-serif text-[48px] leading-[0.8] -tracking-[0.02em] text-ink-900">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-500 ml-auto">
                  {t(`steps.${key}.when`)}
                </span>
              </div>
              <h3 className="font-serif text-[26px] leading-[1.08] -tracking-[0.01em] text-ink-900 mb-2.5">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="text-[14px] leading-[1.6] text-ink-700 mb-5">
                {t(`steps.${key}.description`)}
              </p>
              <div className="flex gap-2 mt-auto">
                <Plate className="w-[52px] h-[52px] rounded-[2px]" />
                <Plate className="w-[52px] h-[52px] rounded-[2px]" />
                <Plate className="w-[52px] h-[52px] rounded-[2px]" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
