import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

interface BrandRow {
  id: string
  name: string
  slug?: string | null
}

interface HomeBrandsProps {
  brands: BrandRow[]
}

/**
 * Brandline éditoriale (`.brandline`) — un filet fin : label mono à gauche,
 * noms de marques en serif italique séparés par 1px. Remplace l'ancienne grille
 * 6 colonnes. Pas de logos officiels (en attente d'autorisation IP).
 */
export async function HomeBrands({ brands }: HomeBrandsProps) {
  const t = await getTranslations('Home.brands')
  if (brands.length === 0) return null

  return (
    <section className="border-b border-sand-300 bg-sand-50">
      <div className="mx-auto max-w-[1440px] px-[clamp(20px,6vw,104px)] py-[22px] flex items-center flex-wrap max-sm:flex-col max-sm:items-start max-sm:gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500 pr-7 whitespace-nowrap">
          {t('lead')}
        </span>
        <div className="flex items-center flex-wrap flex-1">
          {brands.map((brand, i) => (
            <Link
              key={brand.id}
              href={`/catalogue?brand=${encodeURIComponent(brand.name)}`}
              className={`font-serif italic text-[19px] leading-tight text-ink-700 hover:text-clay-700 py-1 px-[18px] transition-colors ${
                i === 0 ? 'max-sm:pl-0' : 'border-l border-sand-300 max-sm:border-l-0 max-sm:pl-0'
              }`}
            >
              {brand.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
