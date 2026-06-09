import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'
import { fetchEffectivePrices, applyPromo } from '@/lib/pricing'

// 60s (aligné catalogue/PDP/home) : limite l'écart carte-stale vs panier-live
// quand une promo démarre/expire.
export const revalidate = 60

type Brand = { id: string; name: string; slug: string }

type RawProduct = {
  id: string
  slug: string
  name: string
  price: string | number
  currency: string
  product_images: { url: string; alt: string | null }[] | null
}

async function fetchBrand(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  slug: string,
): Promise<Brand | null> {
  const { data } = await supabase
    .from('brands')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()
  return data ?? null
}

async function fetchBrandProducts(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  brandId: string,
): Promise<RawProduct[]> {
  // 1. Ranges de la marque
  const { data: ranges } = await supabase
    .from('ranges')
    .select('id')
    .eq('brand_id', brandId)
  const rangeIds = (ranges ?? []).map((r) => r.id)
  if (rangeIds.length === 0) return []

  // 2. Produits actifs liés à ces ranges (via products.range_id direct
  //    depuis la migration product_ranges → 1-n).
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, price, currency, product_images ( url, alt )')
    .in('range_id', rangeIds)
    .eq('is_active', true)
    .order('name', { ascending: true })
    .returns<RawProduct[]>()

  return products ?? []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = await createSupabaseServerClient()
  const brand = await fetchBrand(supabase, slug)
  const t = await getTranslations({ locale, namespace: 'PageMeta.brand' })

  if (!brand) {
    return { title: t('titleTemplate', { name: '' }) }
  }

  const { data: imgRow } = await supabase
    .from('product_images')
    .select('url, products!inner(range_id, ranges!inner(brand_id))')
    .eq('products.ranges.brand_id', brand.id)
    .limit(1)
    .maybeSingle()
  const ogImage = (imgRow as { url?: string } | null)?.url ?? undefined

  return {
    title: t('titleTemplate', { name: brand.name }),
    description: t('description', { name: brand.name }),
    alternates: {
      canonical: localizedPath(locale, `/marques/${brand.slug}`),
      languages: buildLanguageAlternates(`/marques/${brand.slug}`),
    },
    openGraph: {
      title: t('titleTemplate', { name: brand.name }),
      description: t('description', { name: brand.name }),
      locale,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  }
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const supabase = await createSupabaseServerClient()

  const brand = await fetchBrand(supabase, slug)
  if (!brand) notFound()

  const rawProducts = await fetchBrandProducts(supabase, brand.id)
  const priceMap = await fetchEffectivePrices(supabase, rawProducts.map((p) => p.id))
  const t = await getTranslations('BrandPage')

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />
      <main id="main-content" className="flex-grow px-6 lg:px-14 py-12 max-w-7xl mx-auto w-full">
        <header className="mb-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-clay-700 font-semibold mb-3">
            {t('eyebrow')}
          </div>
          <h1 className="font-serif text-[40px] lg:text-[56px] text-ink-900 leading-[1.05] -tracking-[0.01em]">
            {brand.name}
          </h1>
          <p className="mt-4 text-[15px] text-ink-500 max-w-prose">
            {t('intro', { name: brand.name, count: rawProducts.length })}
          </p>
        </header>

        {rawProducts.length === 0 ? (
          <p className="text-ink-500">{t('empty')}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {rawProducts.map((p) => {
              const { price, oldPrice } = applyPromo(Number(p.price), null, priceMap.get(p.id))
              return (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  price,
                  oldPrice,
                  currency: p.currency,
                  images: (p.product_images ?? []).map((img) => ({
                    url: img.url,
                    alt: img.alt ?? '',
                  })),
                  brand: brand.name,
                }}
              />
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
