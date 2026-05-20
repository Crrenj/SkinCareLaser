import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import CatalogueClient from '@/components/CatalogueClient'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.catalogue' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/catalogue'),
      languages: buildLanguageAlternates('/catalogue'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

type TagItem = { name: string; tag_type: string }
type RangeJoin = {
  range: { id: string; name: string; brand: { id: string; name: string } | null } | null
}
type RawProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  price: string | number
  currency: string
  product_images: { url: string; alt: string | null }[] | null
  product_ranges: RangeJoin[] | null
  product_tags: { tag: TagItem | null }[] | null
}

export default async function Catalogue({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Catalogue')
  const supabase = await createSupabaseServerClient()

  // 1. Produits + marques/gammes + tags
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select(`
      id,
      slug,
      name,
      description,
      price,
      currency,
      product_images ( url, alt ),
      product_ranges (
        range:ranges (
          id,
          name,
          brand:brands ( id, name )
        )
      ),
      product_tags (
        tag:tags_with_types ( name, tag_type )
      )
    `)
    .limit(500)
    .returns<RawProduct[]>()

  // 2. Tous les tags disponibles
  const { data: tags, error: tErr } = await supabase
    .from('tags_with_types')
    .select('name, tag_type')
    .returns<TagItem[]>()

  if (pErr || tErr) {
    console.error(pErr || tErr)
    return <p className="p-6">{t('loadError')}</p>
  }

  // 3. Regrouper les tags par type
  const itemsByType: Record<string, string[]> = {}
  tags?.forEach(t => {
    itemsByType[t.tag_type] ??= []
    itemsByType[t.tag_type].push(t.name)
  })
  Object.keys(itemsByType).forEach(tagType => {
    itemsByType[tagType].sort()
  })

  // 4. Mapper les produits pour le front
  const mappedProducts = (products ?? []).map(p => {
    const firstRange = p.product_ranges?.[0]?.range ?? null
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description ?? '',
      price: Number(p.price),
      currency: p.currency,
      images: p.product_images ?? [],
      brand: firstRange?.brand?.name ?? '',
      range: firstRange?.name ?? '',
      tags: (p.product_tags ?? []).flatMap(pt =>
        pt.tag ? [{ label: pt.tag.name, category: pt.tag.tag_type }] : []
      ),
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--background)]">
      <NavBar />
      <main id="main-content" className="flex-grow p-6">
        <CatalogueClient
          products={mappedProducts}
          itemsByType={itemsByType}
        />
      </main>
      <Footer />
    </div>
  )
}
