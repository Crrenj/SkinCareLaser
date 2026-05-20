import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { HomeSectionHeader } from './HomeSectionHeader'

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
  { slug: 'sunProtection', key: 'sun' as const },
  { slug: 'sensitive', key: 'repair' as const },
  { slug: 'radiance', key: 'brightness' as const },
] as const

/** Mapping slug → visual (gradient + icon). Inconnu = défaut sand neutre. */
const VISUAL_BY_SLUG: Record<string, { gradient: string; icon: 'sun' | 'shield' | 'glow' }> = {
  // Slugs habituels (statique + tags potentiels en DB)
  sunProtection: { gradient: 'from-sand-100 via-[#D89A75] to-clay-600', icon: 'sun' },
  'protection-solaire': { gradient: 'from-sand-100 via-[#D89A75] to-clay-600', icon: 'sun' },
  sensitive: { gradient: 'from-sand-100 via-sand-400 to-ink-500', icon: 'shield' },
  reparation: { gradient: 'from-sand-100 via-sand-400 to-ink-500', icon: 'shield' },
  apaisant: { gradient: 'from-sand-100 via-sand-400 to-ink-500', icon: 'shield' },
  radiance: { gradient: 'from-sand-50 via-clay-200 to-clay-400', icon: 'glow' },
  eclat: { gradient: 'from-sand-50 via-clay-200 to-clay-400', icon: 'glow' },
}

const DEFAULT_VISUAL = { gradient: 'from-sand-100 to-sand-400', icon: 'glow' as const }

/** 3 cards "Besoins". Source : tags featured_on_home, ou fallback statique. */
export async function HomeByNeed({ featured = [] }: HomeByNeedProps) {
  const t = await getTranslations('Home.byNeed')

  // Si la DB n'a pas (encore) marqué 3 tags en featured, on tombe sur le statique
  // — mais on conserve le nombre de produits = 0 (le compteur est juste si DB feed).
  const cards = featured.length >= 3
    ? featured.slice(0, 3).map((tag) => ({
        slug: tag.slug,
        name: tag.name,
        count: tag.count,
        visual: VISUAL_BY_SLUG[tag.slug] ?? DEFAULT_VISUAL,
        useStatic: false as const,
      }))
    : STATIC_CARDS.map((c) => ({
        slug: c.slug,
        name: '', // les strings sont dans la traduction
        count: 0,
        visual: VISUAL_BY_SLUG[c.slug] ?? DEFAULT_VISUAL,
        useStatic: true as const,
        key: c.key,
      }))

  return (
    <section className="px-6 lg:px-14 py-16 bg-sand-100">
      <HomeSectionHeader
        eyebrow={t('eyebrow')}
        title={t.raw('title') as string}
        ctaLabel={t('seeAll')}
        ctaHref="/catalogue"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const title = card.useStatic ? t(`cards.${card.key}.title`) : card.name
          const description = card.useStatic
            ? t(`cards.${card.key}.description`)
            : `${card.count} ${t('productCountSuffix')}`
          const eyebrow = card.useStatic
            ? t(`cards.${card.key}.eyebrow`)
            : `${card.count} ${t('productCountSuffix')}`
          const cta = card.useStatic ? t(`cards.${card.key}.cta`) : t('cards.sun.cta')
          const href = `/catalogue?need=${encodeURIComponent(card.slug)}`

          return (
            <Link
              key={card.slug}
              href={href}
              className="group block bg-white rounded-md border border-sand-300 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_-16px_rgba(31,27,22,0.16)]"
            >
              <div
                className={`aspect-[4/3] bg-gradient-to-br ${card.visual.gradient} flex items-center justify-center`}
              >
                <NeedIcon name={card.visual.icon} />
              </div>
              <div className="p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-clay-700 font-semibold mb-2">
                  {eyebrow}
                </div>
                <h3 className="font-serif text-[24px] md:text-[26px] leading-tight -tracking-[0.015em] text-ink-900 mb-2.5">
                  {title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-ink-700 mb-3.5">
                  {description}
                </p>
                <span className="text-[12px] font-semibold uppercase tracking-wider text-clay-700">
                  {cta}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function NeedIcon({ name }: { name: 'sun' | 'shield' | 'glow' }) {
  switch (name) {
    case 'sun':
      return (
        <svg viewBox="0 0 100 100" className="w-[40%] h-[40%] opacity-90" fill="none" stroke="#FBF8F4" strokeWidth="2" strokeLinecap="round">
          <circle cx="50" cy="50" r="14" />
          <line x1="50" y1="20" x2="50" y2="28" />
          <line x1="50" y1="72" x2="50" y2="80" />
          <line x1="20" y1="50" x2="28" y2="50" />
          <line x1="72" y1="50" x2="80" y2="50" />
          <line x1="29" y1="29" x2="35" y2="35" />
          <line x1="65" y1="65" x2="71" y2="71" />
          <line x1="71" y1="29" x2="65" y2="35" />
          <line x1="35" y1="65" x2="29" y2="71" />
        </svg>
      )
    case 'shield':
      return (
        <svg viewBox="0 0 100 100" className="w-[40%] h-[40%] opacity-90" fill="none" stroke="#FBF8F4" strokeWidth="2" strokeLinecap="round">
          <path d="M50 22 Q70 22 80 42 Q80 62 50 80 Q20 62 20 42 Q30 22 50 22" />
          <line x1="40" y1="48" x2="60" y2="48" />
          <line x1="50" y1="38" x2="50" y2="58" />
        </svg>
      )
    case 'glow':
      return (
        <svg viewBox="0 0 100 100" className="w-[40%] h-[40%] opacity-90" fill="none" stroke="#FBF8F4" strokeWidth="2" strokeLinecap="round">
          <circle cx="50" cy="50" r="20" />
          <circle cx="50" cy="50" r="30" strokeDasharray="3 4" />
        </svg>
      )
  }
}
