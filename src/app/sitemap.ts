import type { MetadataRoute } from 'next'
import { createSupabasePublicClient } from '@/lib/supabasePublic'
import { routing } from '@/i18n/routing'

const BASE_URL = 'https://farmau.do'

// ISR : depuis la bascule cookieless (Phase 1), le sitemap est généré au build
// — sans revalidate, un nouveau produit/post n'y apparaîtrait qu'au prochain
// deploy. 1 h = fraîcheur largement suffisante pour les crawlers.
export const revalidate = 3600

/**
 * Sitemap dynamique : enumerre toutes les pages publiques × 3 locales,
 * plus une entrée par produit actif × 3 locales.
 *
 * hreflang alternates : chaque entrée déclare ses équivalents dans les
 * autres locales via la map `alternates.languages` (Google + Bing).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const supabase = createSupabasePublicClient()

  // Routes statiques publiques (sans le préfixe locale)
  const staticPaths: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/catalogue', priority: 0.9, changeFrequency: 'daily' },
    { path: '/marques', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/a-propos', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/livraison', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/aide', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/pharmacie', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/manifeste', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/legal/mentions-legales', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/cgv', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/confidentialite', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/cookies', priority: 0.3, changeFrequency: 'yearly' },
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
    .eq('tag_type', 'besoins')

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

  // Blog posts — un post n'existe que dans SA locale (posts.locale) : on l'émet
  // à sa propre locale et on n'annonce PAS de fausses traductions hreflang. [C-12]
  const { data: blogPosts } = await supabase
    .from('posts')
    .select('slug, updated_at, locale')
    .eq('is_published', true)

  const blogEntries: MetadataRoute.Sitemap = (blogPosts ?? [])
    .filter((p) => p.slug)
    .map((p) => {
      const postLocale = p.locale ?? routing.defaultLocale
      const url = `${BASE_URL}/${postLocale}/blog/${p.slug}`
      return {
        url,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: {
          languages: { [postLocale]: url, 'x-default': url },
        },
      }
    })

  return [...staticEntries, ...brandEntries, ...needEntries, ...productEntries, ...blogEntries]
}
