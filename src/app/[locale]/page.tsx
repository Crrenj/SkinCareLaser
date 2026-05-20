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
}

interface RawBestseller {
  id: string
  name: string
  description: string | null
  price: string | number
  currency: string
  product_images: { url: string; alt: string | null }[] | null
  product_ranges:
    | { range: { name: string; brand: { name: string } | null } | null }[]
    | null
}

interface MappedBestseller {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  images: { url: string; alt: string | null }[]
  brand?: string
  range?: string
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

  // Fetch en parallèle : bannières CMS + bestsellers + marques + quote.
  const [bannersRes, bestsellersRes, brandsRes, quoteRes] = await Promise.all([
    supabase
      .from('banners')
      .select('id, title, description, image_url, link_url, link_text, banner_type, position')
      .eq('is_active', true)
      .order('position', { ascending: true }),
    supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        currency,
        product_images ( url, alt ),
        product_ranges (
          range:ranges ( name, brand:brands ( name ) )
        )
      `)
      .limit(4)
      .returns<RawBestseller[]>(),
    supabase.from('brands').select('id, name, slug').order('name', { ascending: true }),
    fetchHomeQuote(supabase),
  ])

  const activeBanners = (bannersRes.data ?? []) as BannerRow[]
  const bestsellers: MappedBestseller[] = (bestsellersRes.data ?? []).map(mapBestseller)
  const brands = (brandsRes.data ?? []) as BrandRow[]

  return (
    <div className="flex flex-col min-h-screen bg-sand-200" lang={locale}>
      <NavBar />

      <main id="main-content" className="flex-1">
        <HomeHero />
        <HomeBestsellers products={bestsellers} />
        <HomeByNeed />

        {/* Pharmacist quote — si un produit a une advice */}
        {quoteRes && (
          <section className="px-6 lg:px-14 py-12 bg-sand-50">
            <BannerQuote
              id="home-pharmacist-quote"
              title={quoteRes.quote}
              attribution={{
                name: quoteRes.name,
              }}
            />
          </section>
        )}

        <HomeBrands brands={brands} />
        <HomeExpertise />
        <HomeRoutine />

        {/* Bannières CMS optionnelles — en complément, jamais en remplacement du hero */}
        {activeBanners.length > 0 && (
          <section className="px-6 lg:px-14 py-12 bg-sand-50 space-y-8">
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
              />
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

function mapBestseller(p: RawBestseller): MappedBestseller {
  const firstRange = p.product_ranges?.[0]?.range ?? null
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? undefined,
    price: Number(p.price),
    currency: p.currency,
    images: p.product_images ?? [],
    brand: firstRange?.brand?.name ?? undefined,
    range: firstRange?.name ?? undefined,
  }
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

  // Colonne manquante ou erreur → on cache silencieusement la section.
  if (error || !data || data.length === 0) return null

  const random = data[Math.floor(Math.random() * data.length)]
  if (!random.pharmacist_advice) return null

  return {
    quote: random.pharmacist_advice,
    name: random.pharmacist_name ?? 'Équipe FARMAU',
  }
}
