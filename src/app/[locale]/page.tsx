import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import Banner from '@/components/Banner'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeBestsellers } from '@/components/home/HomeBestsellers'
import { HomeByNeed } from '@/components/home/HomeByNeed'
import { HomeBrands } from '@/components/home/HomeBrands'
import { HomeExpertise } from '@/components/home/HomeExpertise'
import { HomeRoutine } from '@/components/home/HomeRoutine'
import { BannerQuote } from '@/components/banners/BannerQuote'
import { getShopSettings } from '@/lib/getShopSettings'
import { resolveHomeLayout, type HomeSectionKey } from '@/lib/homeSections'
import { Fragment, type ReactNode } from 'react'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.home' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/'),
      languages: buildLanguageAlternates('/'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

interface BannerRow {
  id: string
  title: string
  description: string | null
  image_url: string | null
  link_url: string | null
  link_text: string | null
  banner_type:
    | 'image_left'
    | 'image_right'
    | 'image_full'
    | 'card_style'
    | 'minimal'
    | 'gradient_overlay'
    | 'editorial'
    | 'hero'
    | 'quote'
  position: number
  direction: 'left' | 'right' | null
  attribution_name: string | null
  attribution_title: string | null
  attribution_photo_url: string | null
}

interface BestsellerIdRow {
  id: string | null
}

interface RawBestseller {
  id: string
  slug: string | null
  name: string
  description: string | null
  price: string | number
  currency: string
  is_new: boolean | null
  product_images: { url: string; alt: string | null }[] | null
  range: { name: string; brand: { name: string } | null } | null
}

interface MappedBestseller {
  id: string
  slug?: string
  name: string
  description?: string
  price: number
  currency: string
  images: { url: string; alt: string | null }[]
  brand?: string
  range?: string
  isNew?: boolean
}

interface FeaturedNeedTag {
  slug: string
  name: string
  count: number
}

interface BrandRow {
  id: string
  name: string
  slug: string | null
}

interface QuoteProductRow {
  id: string
  pharmacist_advice: string | null
  pharmacist_name: string | null
}

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createSupabaseServerClient()

  // Fetch en parallèle : bannières CMS + bestsellers + marques + quote + featured needs.
  const [bannersRes, bestsellers, brandsRes, quoteRes, featuredNeeds, settings, productCountRes] = await Promise.all([
    supabase
      .from('banners')
      .select('id, title, description, image_url, link_url, link_text, banner_type, position, direction, attribution_name, attribution_title, attribution_photo_url')
      .eq('is_active', true)
      .order('position', { ascending: true }),
    fetchBestsellers(supabase),
    supabase.from('brands').select('id, name, slug').order('name', { ascending: true }),
    fetchHomeQuote(supabase),
    fetchFeaturedNeeds(supabase),
    getShopSettings(),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const activeBanners = (bannersRes.data ?? []) as BannerRow[]
  const brands = (brandsRes.data ?? []) as BrandRow[]
  const productCount = productCountRes.count ?? undefined

  // Ordre + visibilité des sections piloté par l'admin (shop_settings.home_layout,
  // colonne JSONB lue via cast — résolveur tolérant aux valeurs partielles/nulles).
  const layout = resolveHomeLayout((settings as { home_layout?: unknown }).home_layout)

  // Chaque section → son rendu (null = rien à afficher, ex. pas de citation).
  const sections: Record<HomeSectionKey, ReactNode> = {
    hero: <HomeHero productCount={productCount} brandCount={brands.length} />,
    bestsellers: <HomeBestsellers products={bestsellers} />,
    byNeed: <HomeByNeed featured={featuredNeeds} />,
    quote: quoteRes ? (
      <BannerQuote
        id="home-pharmacist-quote"
        title={quoteRes.quote}
        attribution={{ name: quoteRes.name }}
      />
    ) : null,
    brands: <HomeBrands brands={brands} />,
    expertise: <HomeExpertise />,
    routine: <HomeRoutine />,
    banners: activeBanners.length > 0 ? (
      <>
        {activeBanners.map((banner) => (
          <Banner
            key={banner.id}
            id={banner.id}
            type={banner.banner_type}
            title={banner.title}
            description={banner.description || undefined}
            imageUrl={banner.image_url || undefined}
            ctaLabel={banner.link_text || undefined}
            ctaHref={banner.link_url || undefined}
            direction={banner.direction || undefined}
            attribution={
              banner.attribution_name
                ? {
                    name: banner.attribution_name,
                    title: banner.attribution_title || undefined,
                    photoUrl: banner.attribution_photo_url || undefined,
                  }
                : undefined
            }
          />
        ))}
      </>
    ) : null,
  }

  return (
    <div className="flex flex-col min-h-screen bg-sand-50" lang={locale}>
      <NavBar />

      <main id="main-content" className="flex-1">
        {layout
          .filter((s) => s.enabled)
          .map((s) => (
            <Fragment key={s.key}>{sections[s.key]}</Fragment>
          ))}
      </main>

      <Footer />
    </div>
  )
}

function mapBestseller(p: RawBestseller): MappedBestseller {
  return {
    id: p.id,
    slug: p.slug ?? undefined,
    name: p.name,
    description: p.description ?? undefined,
    price: Number(p.price),
    currency: p.currency,
    images: p.product_images ?? [],
    brand: p.range?.brand?.name ?? undefined,
    range: p.range?.name ?? undefined,
    isNew: p.is_new ?? undefined,
  }
}

/**
 * Bestsellers via la vue v_bestsellers (tri sold_30d desc + is_featured + created_at).
 * En 2 requêtes : 4 IDs de la vue, puis détails produits avec joins brand/range.
 */
async function fetchBestsellers(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<MappedBestseller[]> {
  const { data: idRows, error: viewErr } = await supabase
    .from('v_bestsellers')
    .select('id')
    .limit(4)
    .returns<BestsellerIdRow[]>()

  if (viewErr || !idRows || idRows.length === 0) {
    // Fallback : vue absente ou vide → premiers 4 produits actifs (degraded).
    const { data } = await supabase
      .from('products')
      .select(`
        id, slug, name, description, price, currency, is_new,
        product_images ( url, alt ),
        range:ranges ( name, brand:brands ( name ) )
      `)
      .limit(4)
      .returns<RawBestseller[]>()
    return (data ?? []).map(mapBestseller)
  }

  const ids = idRows.map((r) => r.id).filter((id): id is string => !!id)
  if (ids.length === 0) return []

  const { data } = await supabase
    .from('products')
    .select(`
      id, slug, name, description, price, currency,
      product_images ( url, alt ),
      range:ranges ( name, brand:brands ( name ) )
    `)
    .in('id', ids)
    .returns<RawBestseller[]>()

  // Preserve l'ordre de la vue (sold_30d desc).
  const byId = new Map((data ?? []).map((p) => [p.id, p]))
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is RawBestseller => p !== undefined)
    .map(mapBestseller)
}

/**
 * Sélectionne 1 produit aléatoire avec un `pharmacist_advice` non vide
 * pour intercaler une citation dans la home. Si la colonne n'existe pas
 * encore ou si rien ne matche, on retourne null (le bloc disparaît).
 */
async function fetchHomeQuote(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<{ quote: string; name: string } | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, pharmacist_advice, pharmacist_name')
    .not('pharmacist_advice', 'is', null)
    .limit(10)
    .returns<QuoteProductRow[]>()

  if (error || !data || data.length === 0) return null

  const random = data[Math.floor(Math.random() * data.length)]
  if (!random.pharmacist_advice) return null

  return {
    quote: random.pharmacist_advice,
    name: random.pharmacist_name ?? 'Équipe FARMAU',
  }
}

/**
 * 3 tags marqués `featured_on_home` + count produits associés.
 * Si moins de 3, le composant HomeByNeed complète avec son fallback statique.
 */
interface FeaturedTagRow {
  id: string
  slug: string
  name: string
}

async function fetchFeaturedNeeds(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<FeaturedNeedTag[]> {
  const { data: tagRows, error } = await supabase
    .from('tags')
    .select('id, slug, name')
    .eq('featured_on_home', true)
    .limit(3)
    .returns<FeaturedTagRow[]>()

  if (error || !tagRows || tagRows.length === 0) return []

  // Compte produits par tag — 1 query par tag (3 max, négligeable).
  const counts = await Promise.all(
    tagRows.map(async (t) => {
      const { count } = await supabase
        .from('product_tags')
        .select('product_id', { count: 'exact', head: true })
        .eq('tag_id', t.id)
      return count ?? 0
    }),
  )

  return tagRows.map((t, i) => ({
    slug: t.slug,
    name: t.name,
    count: counts[i],
  }))
}
