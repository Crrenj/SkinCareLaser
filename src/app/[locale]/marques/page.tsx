import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { Link } from '@/i18n/navigation'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'
import { safeJsonLd } from '@/lib/jsonLd'

export const revalidate = 300

type BrandRow = { id: string; name: string; slug: string }

type BrandCard = {
  id: string
  name: string
  slug: string
  productCount: number
  imageUrl: string | null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.brandsIndex' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/marques'),
      languages: buildLanguageAlternates('/marques'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

async function fetchBrandCards(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<BrandCard[]> {
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug')
    .order('name', { ascending: true })
    .returns<BrandRow[]>()

  if (!brands || brands.length === 0) return []

  // Pour chaque marque, on récupère en parallèle : count produits actifs + une image représentative.
  const cards = await Promise.all(
    brands.map(async (brand) => {
      // 1. Ranges de la marque
      const { data: ranges } = await supabase
        .from('ranges')
        .select('id')
        .eq('brand_id', brand.id)
      const rangeIds = (ranges ?? []).map((r) => r.id)

      if (rangeIds.length === 0) {
        return {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          productCount: 0,
          imageUrl: null,
        }
      }

      // 2. Produits actifs liés à ces ranges (via products.range_id direct
      //    depuis la migration product_ranges → 1-n).
      const { data: productLinks } = await supabase
        .from('products')
        .select('id')
        .in('range_id', rangeIds)
      const productIds = (productLinks ?? []).map((l) => l.id)

      if (productIds.length === 0) {
        return {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          productCount: 0,
          imageUrl: null,
        }
      }

      // 3. Count actifs + 1 image représentative
      const [{ count }, { data: imageRow }] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .in('id', productIds)
          .eq('is_active', true),
        supabase
          .from('products')
          .select('product_images!inner(url)')
          .in('id', productIds)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle(),
      ])

      const image = (imageRow as { product_images?: { url: string }[] } | null)
        ?.product_images?.[0]?.url ?? null

      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        productCount: count ?? 0,
        imageUrl: image,
      }
    }),
  )

  return cards
}

export default async function MarquesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const supabase = await createSupabaseServerClient()

  const [cards, t] = await Promise.all([
    fetchBrandCards(supabase),
    getTranslations('BrandsIndex'),
  ])

  const totalProducts = cards.reduce((sum, c) => sum + c.productCount, 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('title').replace(/<[^>]+>/g, ''),
    url: localizedPath(locale, '/marques'),
    numberOfItems: cards.length,
  }

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />

      <main id="main-content" className="flex-grow px-6 lg:px-14 py-12 max-w-7xl mx-auto w-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
        <header className="mb-12 pb-8 border-b border-sand-300">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-clay-700 font-semibold mb-3">
            {t('eyebrow')}
          </div>
          <h1 className="font-serif text-[40px] lg:text-[56px] text-ink-900 leading-[1.05] -tracking-[0.01em] mb-4 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-700"
            dangerouslySetInnerHTML={{ __html: t.raw('title') as string }}
          />
          <p className="text-[15px] text-ink-700 max-w-prose leading-relaxed">
            {t('intro', { brands: cards.length, products: totalProducts })}
          </p>
        </header>

        {cards.length === 0 ? (
          <p className="text-ink-500 py-12 text-center">{t('empty')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
            {cards.map((brand) => (
              <BrandCardLink key={brand.id} brand={brand} cta={t('cardCta')} productSuffix={t('productSuffix')} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

function BrandCardLink({
  brand,
  cta,
  productSuffix,
}: {
  brand: BrandCard
  cta: string
  productSuffix: string
}) {
  return (
    <Link
      href={`/marques/${brand.slug}`}
      className="group flex flex-col bg-sand-100 border border-sand-300 rounded-md overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_-16px_rgba(31,27,22,0.16)]"
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-sand-100 via-sand-300 to-sand-500 overflow-hidden">
        {brand.imageUrl ? (
          <Image
            src={brand.imageUrl}
            alt={brand.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-8 mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif italic text-[44px] text-sand-50">{brand.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/15 to-transparent pointer-events-none" />
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col">
        <h2 className="font-serif text-[24px] leading-tight -tracking-[0.01em] text-ink-900 mb-1">
          {brand.name}
        </h2>
        <p className="text-[13px] text-ink-500 mb-4">
          {brand.productCount} {productSuffix}
        </p>
        <span className="mt-auto inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-clay-700">
          {cta}
          <ArrowRight size={14} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
