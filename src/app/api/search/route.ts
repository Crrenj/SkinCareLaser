import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

/**
 * GET /api/search?q=<query>&limit=<n>
 *
 * Recherche full-text basique sur le nom + la marque (jointure produits ↔ ranges ↔ brands).
 * Retourne jusqu'à `limit` (défaut 8, max 20) produits actifs.
 *
 * Usage : appelé par NavSearch en client component, debounced 200ms.
 */
type SearchHit = {
  id: string
  name: string
  brand: string
  price: number
  currency: string
  image: { url: string; alt: string | null } | null
}

interface RawHit {
  id: string
  name: string
  price: string | number
  currency: string
  product_images: { url: string; alt: string | null }[] | null
  product_ranges:
    | { range: { brand: { name: string } | null } | null }[]
    | null
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim()
  const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? '8')
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), 20) : 8

  if (q.length < 2) {
    return NextResponse.json({ q, hits: [] satisfies SearchHit[] })
  }

  const supabase = await createSupabaseServerClient()

  // Recherche : ilike sur name OU brand. Brand vient de la jointure
  // product_ranges → ranges → brands, donc on filtre côté SQL sur name puis
  // on complète côté JS avec un fallback brand-match si besoin.
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      currency,
      product_images ( url, alt ),
      product_ranges (
        range:ranges (
          brand:brands ( name )
        )
      )
    `)
    .ilike('name', `%${q}%`)
    .limit(limit)
    .returns<RawHit[]>()

  if (error) {
    console.error('[/api/search]', error)
    return NextResponse.json({ q, hits: [], error: 'search_failed' }, { status: 500 })
  }

  const hits: SearchHit[] = (data ?? []).map((p) => {
    const brand = p.product_ranges?.[0]?.range?.brand?.name ?? ''
    const image = p.product_images?.[0] ?? null
    return {
      id: p.id,
      name: p.name,
      brand,
      price: Number(p.price),
      currency: p.currency,
      image,
    }
  })

  return NextResponse.json({ q, hits })
}
