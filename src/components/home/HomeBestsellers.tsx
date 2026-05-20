import { getTranslations } from 'next-intl/server'
import ProductCard from '@/components/ProductCard'
import { HomeSectionHeader } from './HomeSectionHeader'

interface MappedProduct {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  images: { url: string; alt: string | null }[]
  brand?: string
  range?: string
}

interface HomeBestsellersProps {
  products: MappedProduct[]
}

/** Grille 4 best-sellers. Reuses ProductCard. Server component. */
export async function HomeBestsellers({ products }: HomeBestsellersProps) {
  const t = await getTranslations('Home.bestsellers')
  if (products.length === 0) return null

  return (
    <section className="px-6 lg:px-14 py-16 bg-sand-50">
      <HomeSectionHeader
        eyebrow={t('eyebrow')}
        title={t.raw('title') as string}
        ctaLabel={t('seeAll')}
        ctaHref="/catalogue"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {products.slice(0, 4).map((p) => (
          <ProductCard
            key={p.id}
            product={{
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              currency: p.currency,
              images: p.images.map((img) => ({ url: img.url, alt: img.alt ?? '' })),
              brand: p.brand,
              range: p.range,
            }}
          />
        ))}
      </div>
    </section>
  )
}
