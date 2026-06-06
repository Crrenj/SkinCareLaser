import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { HomeSectionHeader } from './HomeSectionHeader'
import { Plate } from '@/components/ui/Plate'

export interface FeaturedNeed {
  slug: string
  name: string
  count: number
}

interface HomeByNeedProps {
  /** Tags marqués `featured_on_home` en DB. Si vide, on tombe sur le set statique. */
  featured?: FeaturedNeed[]
}

/** Set statique de secours quand aucun tag n'est marqué featured_on_home. */
const STATIC_CARDS = [
  { slug: 'protection-solaire', key: 'sun' as const },
  { slug: 'reparation', key: 'repair' as const },
  { slug: 'eclat', key: 'brightness' as const },
] as const

/**
 * 3 cartes « Par besoin » (`.needs`) — grille éditoriale séparée par 1px,
 * plaque image 16:10 + corps. Source : tags featured_on_home, ou fallback
 * statique localisé.
 */
export async function HomeByNeed({ featured = [] }: HomeByNeedProps) {
  const t = await getTranslations('Home.byNeed')

  const cards =
    featured.length >= 3
      ? featured.slice(0, 3).map((tag) => ({
          slug: tag.slug,
          name: tag.name,
          count: tag.count,
          useStatic: false as const,
        }))
      : STATIC_CARDS.map((c) => ({
          slug: c.slug,
          key: c.key,
          useStatic: true as const,
        }))

  return (
    <section className="bg-sand-50 py-[clamp(56px,9vw,128px)]">
      <div className="mx-auto max-w-[1440px] px-[clamp(20px,6vw,104px)]">
        <HomeSectionHeader
          index="02"
          kicker={t('eyebrow')}
          title={t.raw('title') as string}
          ctaLabel={t('seeAll')}
          ctaHref="/catalogue"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-sand-300 border border-sand-300">
          {cards.map((card) => {
            const title = card.useStatic ? t(`cards.${card.key}.title`) : card.name
            const count = card.useStatic
              ? t(`cards.${card.key}.eyebrow`)
              : `${card.count} ${t('productCountSuffix')}`
            const description = card.useStatic ? t(`cards.${card.key}.description`) : null
            const href = `/catalogue?need=${encodeURIComponent(card.slug)}`

            return (
              <Link
                key={card.slug}
                href={href}
                className="group bg-sand-50 hover:bg-sand-100 transition-colors flex flex-col"
              >
                <Plate className="aspect-[16/10] border-0 border-b border-sand-300" />
                <div className="p-[26px] pb-7 flex flex-col flex-1">
                  <div className="font-mono text-[11px] tracking-[0.1em] text-ink-500 mb-3">
                    {count}
                  </div>
                  <h3 className="font-serif text-[30px] leading-[1.04] -tracking-[0.015em] text-ink-900 mb-2.5">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-[14px] leading-[1.55] text-ink-700 mb-[22px]">
                      {description}
                    </p>
                  )}
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-clay-700 mt-auto inline-flex items-center gap-2">
                    {t('explore')}
                    <span className="transition-transform group-hover:translate-x-[5px]">→</span>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
