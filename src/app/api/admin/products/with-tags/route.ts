import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Configuration manquante' },
      { status: 500 }
    )
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    
    const offset = (page - 1) * limit
    
    // Récupérer les produits
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
    
    // Récupérer les tags pour chaque produit
    const productIds = products?.map(p => p.id) || []
    let productTags: any[] = []
    
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
    
    // Combiner les données
    const productsWithTags = products?.map(product => ({
      ...product,
      brand: product.product_ranges?.[0]?.ranges?.brands || null,
      range: product.product_ranges?.[0]?.ranges || null,
      image_url: product.product_images?.[0]?.url || product.image_url,
      product_tags: productTags.filter((pt: any) => pt.product_id === product.id)
    }))
    
    return NextResponse.json({
      products: productsWithTags,
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des produits' },
      { status: 500 }
    )
  }
} 