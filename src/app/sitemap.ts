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

  // Produits actifs (IDs uniquement — le routage actuel utilise [id])
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('is_active', true)

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE_URL}/${routing.defaultLocale}/product/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `${BASE_URL}/${loc}/product/${p.id}`]),
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

  return [...staticEntries, ...productEntries]
}
