import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { HomeSectionHeader } from './HomeSectionHeader'

interface BrandRow {
  id: string
  name: string
  slug?: string | null
}

interface HomeBrandsProps {
  brands: BrandRow[]
}

/**
 * Grille de marques 6 colonnes (3 sur mobile/tablet).
 * Pas de logos officiels — noms en serif italic sur cellules sand-50,
 * jusqu'à ce qu'on ait l'autorisation IP.
 */
export async function HomeBrands({ brands }: HomeBrandsProps) {
  const t = await getTranslations('Home.brands')
  if (brands.length === 0) return null

  return (
    <section className="px-6 lg:px-14 py-16 bg-sand-50">
      <HomeSectionHeader
        eyebrow={`${brands.length} ${t('eyebrowSuffix')}`}
        title={t.raw('title') as string}
        ctaLabel={t('seeAll')}
        ctaHref="/catalogue"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-l border-sand-300">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/catalogue?brand=${encodeURIComponent(brand.name)}`}
            className="aspect-[3/2] bg-sand-50 hover:bg-white border-r border-b border-sand-300 flex items-center justify-center font-serif italic text-[16px] md:text-[19px] text-ink-700 hover:text-ink-900 transition-colors text-center px-2"
          >
            {brand.name}
          </Link>
        ))}
      </div>
    </section>
  )
}
