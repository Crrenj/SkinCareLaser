import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { HomeSectionHeader } from './HomeSectionHeader'
import { Plate } from '@/components/ui/Plate'

interface MappedProduct {
  id: string
  slug?: string
  name: string
  price: number
  currency: string
  images: { url: string; alt: string | null }[]
  brand?: string
  isNew?: boolean
}

interface HomeBestsellersProps {
  products: MappedProduct[]
}

/**
 * Grille éditoriale des 4 best-sellers (`.prod-grid`) — cellules séparées par
 * 1px sur fond sand-300, carte display-only qui pointe vers la fiche. Le #1
 * (top sold_30d de la vue) porte le tag « le plus réservé ».
 */
export async function HomeBestsellers({ products }: HomeBestsellersProps) {
  const t = await getTranslations('Home.bestsellers')
  const locale = await getLocale()
  if (products.length === 0) return null

  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const items = products.slice(0, 4)

  return (
    <section className="bg-sand-50 py-[clamp(56px,9vw,128px)]">
      <div className="mx-auto max-w-[1440px] px-[clamp(20px,6vw,104px)]">
        <HomeSectionHeader
          index="01"
          kicker={t('eyebrow')}
          title={t.raw('title') as string}
          ctaLabel={t('seeAll')}
          ctaHref="/catalogue"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-sand-300 border border-sand-300">
          {items.map((p, i) => {
            const href = p.slug ? `/product/${p.slug}` : '/catalogue'
            const img = p.images?.[0]
            const tag =
              i === 0
                ? { label: t('tagHot'), hot: true }
                : p.isNew
                  ? { label: t('tagNew'), hot: false }
                  : null
            return (
              <article
                key={p.id}
                className="group relative bg-sand-50 hover:bg-sand-100 transition-colors p-[22px] pb-5 flex flex-col"
              >
                {tag && (
                  <span
                    className={`absolute top-[18px] right-[18px] font-mono text-[9.5px] uppercase tracking-[0.1em] ${
                      tag.hot ? 'text-clay-700' : 'text-ink-500'
                    }`}
                  >
                    {tag.label}
                  </span>
                )}
                <Link href={href} className="block">
                  {img ? (
                    <div className="relative aspect-square mb-[18px] rounded-[2px] overflow-hidden bg-sand-100 border border-sand-300">
                      <Image
                        src={img.url}
                        alt={img.alt ?? p.name}
                        fill
                        sizes="(max-width:1040px) 50vw, 25vw"
                        className="object-contain p-2"
                      />
                    </div>
                  ) : (
                    <Plate className="aspect-square mb-[18px] rounded-[2px]" />
                  )}
                </Link>
                {p.brand && (
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-500 mb-2">
                    {p.brand}
                  </div>
                )}
                <h3 className="font-serif text-[23px] leading-[1.08] -tracking-[0.01em] text-ink-900 mb-auto">
                  <Link href={href} className="hover:text-clay-800 transition-colors">
                    {p.name}
                  </Link>
                </h3>
                <div className="flex items-baseline justify-between pt-[18px] mt-[18px] border-t border-sand-300">
                  <span className="font-serif text-[25px] -tracking-[0.01em] text-ink-900">
                    {nf.format(p.price)}
                    <span className="font-mono text-[12px] text-ink-500 ml-1.5">{p.currency}</span>
                  </span>
                  <Link
                    href={href}
                    className="text-[12px] text-ink-700 border-b border-sand-400 pb-0.5 group-hover:text-clay-700 group-hover:border-clay-700 transition-colors"
                  >
                    {t('seeProduct')}
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
