import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

export const revalidate = 300

type Tag = { id: string; name: string; slug: string }

type RawProduct = {
  id: string
  slug: string
  name: string
  price: string | number
  currency: string
  product_images: { url: string; alt: string | null }[] | null
  product_ranges:
    | { range: { brand: { name: string } | null } | null }[]
    | null
}

async function fetchNeedTag(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  slug: string,
): Promise<Tag | null> {
  const { data } = await supabase
    .from('tags_with_types')
    .select('id, name, slug')
    .eq('slug', slug)
    .eq('tag_type', 'Besoins')
    .maybeSingle()
  return data ?? null
}

async function fetchProductsByTag(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  tagId: string,
): Promise<RawProduct[]> {
  const { data: links } = await supabase
    .from('product_tags')
    .select('product_id')
    .eq('tag_id', tagId)
  const productIds = Array.from(new Set((links ?? []).map((l) => l.product_id)))
  if (productIds.length === 0) return []

  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      slug,
      name,
      price,
      currency,
      product_images ( url, alt ),
      product_ranges (
        range:ranges ( brand:brands ( name ) )
      )
    `)
    .in('id', productIds)
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
  const tag = await fetchNeedTag(supabase, slug)
  const t = await getTranslations({ locale, namespace: 'PageMeta.need' })

  if (!tag) {
    return { title: t('titleTemplate', { name: '' }) }
  }

  return {
    title: t('titleTemplate', { name: tag.name }),
    description: t('description', { name: tag.name }),
    alternates: {
      canonical: localizedPath(locale, `/besoins/${tag.slug}`),
      languages: buildLanguageAlternates(`/besoins/${tag.slug}`),
    },
    openGraph: {
      title: t('titleTemplate', { name: tag.name }),
      description: t('description', { name: tag.name }),
      locale,
      type: 'website',
    },
  }
}

export default async function NeedPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const supabase = await createSupabaseServerClient()

  const tag = await fetchNeedTag(supabase, slug)
  if (!tag) notFound()

  const rawProducts = await fetchProductsByTag(supabase, tag.id)
  const t = await getTranslations('NeedPage')

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />
      <main id="main-content" className="flex-grow px-6 lg:px-14 py-12 max-w-7xl mx-auto w-full">
        <header className="mb-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-clay-700 font-semibold mb-3">
            {t('eyebrow')}
          </div>
          <h1 className="font-serif text-[40px] lg:text-[56px] text-ink-900 leading-[1.05] -tracking-[0.01em] capitalize">
            {tag.name}
          </h1>
          <p className="mt-4 text-[15px] text-ink-500 max-w-prose">
            {t('intro', { name: tag.name, count: rawProducts.length })}
          </p>
        </header>

        {rawProducts.length === 0 ? (
          <p className="text-ink-500">{t('empty')}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {rawProducts.map((p) => {
              const brand = p.product_ranges?.[0]?.range?.brand?.name ?? undefined
              return (
                <ProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    slug: p.slug,
                    name: p.name,
                    price: Number(p.price),
                    currency: p.currency,
                    images: (p.product_images ?? []).map((img) => ({
                      url: img.url,
                      alt: img.alt ?? '',
                    })),
                    brand,
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
