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
 * Brandline éditoriale — filet fin : label mono à gauche, noms de marques en
 * serif italique qui défilent en continu (marquee CSS), fondus aux extrémités,
 * pause au survol, statique en `prefers-reduced-motion`. Remplace la grille
 * 6 colonnes ; gère proprement n'importe quel nombre de marques.
 */
export async function HomeBrands({ brands }: HomeBrandsProps) {
  const t = await getTranslations('Home.brands')
  if (brands.length === 0) return null

  // Dupliqué pour une boucle sans couture (la piste défile de -50%).
  const loop = [...brands, ...brands]

  return (
    <section className="border-b border-sand-300 bg-sand-50">
      <div className="mx-auto max-w-[1440px] px-[clamp(20px,6vw,104px)] py-5 flex items-center gap-7 max-sm:flex-col max-sm:items-start max-sm:gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500 whitespace-nowrap shrink-0">
          {t('lead')}
        </span>
        <div className="relative min-w-0 flex-1 max-sm:w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)]">
          <div className="flex w-max items-center gap-x-10 animate-[marquee_42s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none">
            {loop.map((brand, i) => {
              const dup = i >= brands.length
              return (
                <Link
                  key={`${brand.id}-${i}`}
                  href={`/catalogue?brand=${encodeURIComponent(brand.name)}`}
                  aria-hidden={dup}
                  tabIndex={dup ? -1 : undefined}
                  className="font-serif italic text-[21px] leading-none text-ink-600 hover:text-clay-700 transition-colors whitespace-nowrap"
                >
                  {brand.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
