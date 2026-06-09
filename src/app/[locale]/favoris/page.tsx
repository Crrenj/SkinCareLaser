import type { Metadata } from 'next'
import { redirect } from '@/i18n/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { Link } from '@/i18n/navigation'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { fetchEffectivePrices, applyPromo } from '@/lib/pricing'

export const dynamic = 'force-dynamic' // favoris dépend de l'user connecté

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Favoris' })
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    alternates: {
      canonical: localizedPath(locale, '/favoris'),
      languages: buildLanguageAlternates('/favoris'),
    },
    robots: { index: false, follow: false },
  }
}

interface RawProduct {
  id: string
  slug: string | null
  name: string
  description: string | null
  price: string | number
  currency: string | null
  product_images: { url: string; alt: string | null }[] | null
  range: { name: string; brand: { name: string } | null } | null
}

export default async function FavorisPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: '/login?redirectedFrom=/favoris', locale })
  }

  const t = await getTranslations('Favoris')

  // Récupère les product_ids favoris + détails produits en 2 requêtes
  const { data: wishlistRows } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const productIds = (wishlistRows ?? []).map((r) => r.product_id)

  let products: RawProduct[] = []
  if (productIds.length > 0) {
    const { data } = await supabase
      .from('products')
      .select(`
        id,
        slug,
        name,
        description,
        price,
        currency,
        product_images ( url, alt ),
        range:ranges ( name, brand:brands ( name ) )
      `)
      .in('id', productIds)
      .returns<RawProduct[]>()

    products = data ?? []
  }

  // Préserve l'ordre wishlists (plus récent en premier)
  const productById = new Map(products.map((p) => [p.id, p]))
  const ordered = productIds
    .map((id) => productById.get(id))
    .filter((p): p is RawProduct => p !== undefined)
  const priceMap = await fetchEffectivePrices(supabase, ordered.map((p) => p.id))

  return (
    <div className="flex flex-col min-h-screen bg-sand-50" lang={locale}>
      <NavBar />

      <main id="main-content" className="flex-1 px-6 lg:px-14 py-12 max-w-7xl mx-auto w-full">
        <header className="mb-10 pb-6 border-b border-sand-300">
          <h1 className="font-serif text-[36px] lg:text-[44px] leading-none -tracking-[0.02em] text-ink-900 mb-2">
            {t('heading')}
          </h1>
          <p className="text-[14px] text-ink-500">
            {t('count', { count: ordered.length })}
          </p>
        </header>

        {ordered.length === 0 ? (
          <EmptyState locale={locale} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {ordered.map((p) => {
              const firstRange = p.range
              const { price, oldPrice } = applyPromo(Number(p.price), null, priceMap.get(p.id))
              return (
                <ProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    slug: p.slug ?? p.id,
                    name: p.name,
                    description: p.description ?? undefined,
                    price,
                    oldPrice,
                    currency: p.currency ?? DEFAULT_CURRENCY,
                    images: (p.product_images ?? []).map((img) => ({
                      url: img.url,
                      alt: img.alt,
                    })),
                    brand: firstRange?.brand?.name ?? undefined,
                    range: firstRange?.name ?? undefined,
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

async function EmptyState({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'Favoris' })
  return (
    <div className="text-center py-20">
      <p className="font-serif italic text-[22px] text-ink-700 mb-6 max-w-lg mx-auto">
        {t('emptyDescription')}
      </p>
      <Link
        href="/catalogue"
        className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-sm bg-clay-700 text-on-accent text-[13px] font-semibold uppercase tracking-wider hover:bg-accent-hover transition-colors"
      >
        {t('emptyCta')}
      </Link>
    </div>
  )
}
