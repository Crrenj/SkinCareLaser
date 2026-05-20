import { getTranslations } from 'next-intl/server'
import { HomeSectionHeader } from './HomeSectionHeader'

const STEPS = [
  { key: 'morning' as const, num: '01.' },
  { key: 'evening' as const, num: '02.' },
  { key: 'weekly' as const, num: '03.' },
]

/** Timeline 3 étapes : matin · soir · hebdo. Carte blanche avec gros numéro serif italic. */
export async function HomeRoutine() {
  const t = await getTranslations('Home.routine')

  return (
    <section className="px-6 lg:px-14 py-16 bg-sand-100">
      <HomeSectionHeader
        eyebrow={t('eyebrow')}
        title={t.raw('title') as string}
        ctaLabel={t('seeAll')}
        ctaHref="/a-propos"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {STEPS.map(({ key, num }) => (
          <article
            key={key}
            className="bg-white border border-sand-300 rounded-md p-7 md:p-8"
          >
            <div className="font-serif italic text-[56px] leading-none -tracking-[0.02em] text-clay-400 mb-3">
              {num}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] font-medium text-ink-500 mb-2">
              {t(`steps.${key}.when`)}
            </div>
            <h3 className="font-serif text-[22px] leading-tight text-ink-900 mb-2.5">
              {t(`steps.${key}.title`)}
            </h3>
            <p className="text-[13.5px] leading-[1.55] text-ink-700">
              {t(`steps.${key}.description`)}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
