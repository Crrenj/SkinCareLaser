import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { fetchEffectivePrices } from '@/lib/pricing'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

/**
 * GET /api/search?q=<query>&limit=<n>
 * GET /api/search?bestsellers=1&limit=<n>
 *
 * Recherche basique accent-insensible sur le nom : ilike sur la colonne
 * générée products.name_search (= lower(unaccent(name)), migration
 * 20260610211000, D-4) avec la requête normalisée pareil côté JS — « creme »
 * trouve « Crème » et inversement. Sinon, mode bestsellers pour fallback
 * "aucun résultat" → on retourne les meilleurs vendeurs via la vue
 * v_bestsellers (sold_30d desc + is_featured fallback).
 *
 * Usage : appelé par SearchOverlay en client component, debounced 200ms.
 */
type SearchHit = {
  id: string
  slug: string
  name: string
  brand: string
  price: number
  currency: string
  image: { url: string; alt: string | null } | null
}

interface RawHit {
  id: string
  slug: string
  name: string
  price: string | number
  currency: string
  product_images: { url: string; alt: string | null }[] | null
  range: { brand: { name: string } | null } | null
}

interface RawBestseller {
  id: string
  slug: string | null
  name: string | null
  price: number | null
  currency: string | null
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const bestsellersMode = params.get('bestsellers') === '1'
  const q = (params.get('q') ?? '').trim()
  const rawLimit = Number(params.get('limit') ?? '8')
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), 20) : 8

  // Rate-limit par IP. Endpoint public appelé en live par SearchOverlay
  // (debounce 200ms → au pire ~5 req/s en frappe continue, mais le debounce
  // n'émet qu'à l'arrêt de frappe). 30/min/IP couvre une session de recherche
  // active (plusieurs requêtes + bestsellers fallback) tout en coupant le
  // scraping en boucle du catalogue. failClosed:false : sur incident DB on
  // laisse chercher (trace `[rate-limit] fail-open` émise). Le contrat de
  // succès { q, hits } reste inchangé ; en cas de 429 on renvoie le shape
  // d'erreur existant ({ q, hits: [], error }) → le fetcher SWR du client
  // throw proprement (pas de crash, garde les résultats précédents).
  const ip = getClientIp(request)
  const rl = await checkRateLimit(`search:${ip}`, 30, 60, { failClosed: false })
  if (!rl.allowed) {
    return NextResponse.json(
      { q, hits: [] satisfies SearchHit[], error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const supabase = await createSupabaseServerClient()

  // Mode bestsellers : retourne v_bestsellers (sans tri par marque pour rester rapide)
  if (bestsellersMode) {
    const { data, error } = await supabase
      .from('v_bestsellers')
      .select('id, slug, name, price, currency')
      .limit(limit)
      .returns<RawBestseller[]>()

    if (error) {
      logger.error('[/api/search bestsellers]', error)
      return NextResponse.json({ q: '', hits: [], error: 'search_failed' }, { status: 500 })
    }

    const hits: SearchHit[] = (data ?? [])
      .filter((p) => p.id && p.slug && p.name)
      .map((p) => ({
        id: p.id!,
        slug: p.slug!,
        name: p.name!,
        brand: '',
        price: Number(p.price ?? 0),
        currency: p.currency ?? DEFAULT_CURRENCY,
        image: null,
      }))

    return NextResponse.json({ q: '', hits })
  }

  // Mode recherche : ilike sur name (le brand match côté JS via les jointures)
  if (q.length < 2) {
    return NextResponse.json({ q, hits: [] satisfies SearchHit[] })
  }

  // Normalisation accent-insensible : même transformation que la colonne
  // générée name_search (lower + suppression des diacritiques — NFD ≈
  // unaccent pour es/fr). Puis échappe les métacaractères LIKE (%, _, \) :
  // l'input public ne doit pas injecter de wildcards (DoS requête /
  // scraping). PostgREST couvre déjà l'injection SQL.
  const normalized = q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const safe = normalized.replace(/[\\%_]/g, (c) => `\\${c}`)

  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      slug,
      name,
      price,
      currency,
      product_images ( url, alt ),
      range:ranges ( brand:brands ( name ) )
    `)
    .ilike('name_search', `%${safe}%`)
    .limit(limit)
    .returns<RawHit[]>()

  if (error) {
    logger.error('[/api/search]', error)
    return NextResponse.json({ q, hits: [], error: 'search_failed' }, { status: 500 })
  }

  // Prix effectif (promo) → défaut cohérent pour la vente comptoir + l'overlay.
  const priceMap = await fetchEffectivePrices(supabase, (data ?? []).map((p) => p.id))

  const hits: SearchHit[] = (data ?? []).map((p) => {
    const brand = p.range?.brand?.name ?? ''
    const image = p.product_images?.[0] ?? null
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand,
      price: priceMap.get(p.id)?.effective ?? Number(p.price),
      currency: p.currency,
      image,
    }
  })

  return NextResponse.json({ q, hits })
}
