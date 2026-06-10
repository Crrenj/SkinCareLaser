import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase ANON **sans cookies** pour les Server Components publics
 * (Phase 1 remédiation 2026-06-10).
 *
 * `createSupabaseServerClient` appelle `cookies()` → toute page qui l'utilise
 * bascule en rendu dynamique et ses `revalidate` deviennent des no-op. Les
 * pages publiques (home, PDP, marques, besoins, blog, catalogue, sitemap) ne
 * lisent AUCUNE donnée utilisateur côté serveur (panier/favoris/admin = 100 %
 * client) → ce client anon pur les rend SSG/ISR-éligibles. Même pattern que
 * `getThemeConfig` / `getShopSettings`.
 *
 * Ne JAMAIS l'utiliser là où l'identité de l'utilisateur compte (account,
 * routes API agissant pour le user) — prendre `createSupabaseServerClient`.
 * Volontairement non typé `<Database>` : miroir exact de l'(ab)sence de
 * typage de `createSupabaseServerClient` qu'il remplace (zéro fallout tsc) ;
 * le typage des requêtes pages publiques est un chantier séparé.
 */
export function createSupabasePublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
