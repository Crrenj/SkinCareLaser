import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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
        product_ranges(
          range_id,
          ranges(
            id,
            name,
            brand_id,
            brands(id, name)
          )
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

    const productsWithTags = products?.map((product) => ({
      ...product,
      brand: product.product_ranges?.[0]?.ranges?.brands || null,
      range: product.product_ranges?.[0]?.ranges || null,
      image_url: product.product_images?.[0]?.url || product.image_url,
      product_tags: productTags.filter((pt) => pt.product_id === product.id),
    }))

    return NextResponse.json({
      products: productsWithTags,
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des produits'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
