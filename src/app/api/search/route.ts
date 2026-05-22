import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { DEFAULT_CURRENCY } from '@/lib/constants'

/**
 * GET /api/search?q=<query>&limit=<n>
 * GET /api/search?bestsellers=1&limit=<n>
 *
 * Recherche full-text basique sur le nom (ilike). Sinon, mode bestsellers
 * pour fallback "aucun résultat" → on retourne les meilleurs vendeurs
 * via la vue v_bestsellers (sold_30d desc + is_featured fallback).
 *
 * Usage : appelé par NavSearch en client component, debounced 200ms.
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

  const supabase = await createSupabaseServerClient()

  // Mode bestsellers : retourne v_bestsellers (sans tri par marque pour rester rapide)
  if (bestsellersMode) {
    const { data, error } = await supabase
      .from('v_bestsellers')
      .select('id, slug, name, price, currency')
      .limit(limit)
      .returns<RawBestseller[]>()

    if (error) {
      console.error('[/api/search bestsellers]', error)
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
    .ilike('name', `%${q}%`)
    .limit(limit)
    .returns<RawHit[]>()

  if (error) {
    console.error('[/api/search]', error)
    return NextResponse.json({ q, hits: [], error: 'search_failed' }, { status: 500 })
  }

  const hits: SearchHit[] = (data ?? []).map((p) => {
    const brand = p.range?.brand?.name ?? ''
    const image = p.product_images?.[0] ?? null
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand,
      price: Number(p.price),
      currency: p.currency,
      image,
    }
  })

  return NextResponse.json({ q, hits })
}
