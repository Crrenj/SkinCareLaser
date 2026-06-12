import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { apiError } from '@/lib/apiError'
import { getShopSettings } from '@/lib/getShopSettings'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    let productQuery = supabaseAdmin
      .from('products')
      .select(`
        *,
        range:ranges(
          id,
          name,
          brand_id,
          brand:brands(id, name)
        ),
        product_images(url, alt)
      `, { count: 'exact' })

    if (search) {
      productQuery = productQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: products, error: productError, count } = await productQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (productError) throw productError

    const productIds = products?.map((p) => p.id) || []
    let productTags: Array<{ product_id: string; tag: unknown }> = []

    if (productIds.length > 0) {
      const { data: tagsData, error: tagsError } = await supabaseAdmin
        .from('product_tags')
        .select(`
          product_id,
          tag:tags(
            id,
            name,
            slug,
            tag_type_id
          )
        `)
        .in('product_id', productIds)

      if (!tagsError) {
        productTags = tagsData || []
      }
    }

    const productsWithTags = products?.map((product) => {
      const range = product.range as
        | { id: string; name: string; brand_id: string; brand: { id: string; name: string } | null }
        | null
      return {
        ...product,
        brand: range?.brand ?? null,
        range,
        image_url: product.product_images?.[0]?.url ?? null,
        product_tags: productTags.filter((pt) => pt.product_id === product.id),
      }
    })

    // Seuil « stock faible » configuré — la table produits colore ses lignes
    // et pastilles avec (fini le littéral 10 côté client).
    const { low_stock_threshold: lowStockThreshold } = await getShopSettings()

    return NextResponse.json({
      products: productsWithTags,
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
      lowStockThreshold,
    })
  } catch (error) {
    return apiError('Erreur lors de la récupération des produits', error, 500)
  }
}
