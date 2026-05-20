import type { MetadataRoute } from 'next'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { routing } from '@/i18n/routing'

const BASE_URL = 'https://farmau.do'

/**
 * Sitemap dynamique : enumerre toutes les pages publiques × 3 locales,
 * plus une entrée par produit actif × 3 locales.
 *
 * hreflang alternates : chaque entrée déclare ses équivalents dans les
 * autres locales via la map `alternates.languages` (Google + Bing).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const supabase = await createSupabaseServerClient()

  // Routes statiques publiques (sans le préfixe locale)
  const staticPaths: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/catalogue', priority: 0.9, changeFrequency: 'daily' },
    { path: '/a-propos', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
  ]

  // Produits actifs (slugs — le routage utilise /product/[slug])
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true)

  const productEntries: MetadataRoute.Sitemap = (products ?? [])
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${BASE_URL}/${routing.defaultLocale}/product/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((loc) => [loc, `${BASE_URL}/${loc}/product/${p.slug}`]),
        ),
      },
    }))

  // Pages marques (landing pages SEO par brand)
  const { data: brands } = await supabase.from('brands').select('slug')

  const brandEntries: MetadataRoute.Sitemap = (brands ?? [])
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${BASE_URL}/${routing.defaultLocale}/marques/${b.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((loc) => [loc, `${BASE_URL}/${loc}/marques/${b.slug}`]),
        ),
      },
    }))

  // Pages besoins (landing pages SEO par tag de besoin)
  const { data: needs } = await supabase
    .from('tags_with_types')
    .select('slug')
    .eq('tag_type', 'Besoins')

  const needEntries: MetadataRoute.Sitemap = (needs ?? [])
    .filter((n) => n.slug)
    .map((n) => ({
      url: `${BASE_URL}/${routing.defaultLocale}/besoins/${n.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((loc) => [loc, `${BASE_URL}/${loc}/besoins/${n.slug}`]),
        ),
      },
    }))

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}/${routing.defaultLocale}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `${BASE_URL}/${loc}${path}`]),
      ),
    },
  }))

  return [...staticEntries, ...brandEntries, ...needEntries, ...productEntries]
}
