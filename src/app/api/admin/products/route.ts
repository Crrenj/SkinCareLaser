import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { parseBody, productCreate } from '@/lib/schemas'
import { apiError } from '@/lib/apiError'

// GET /api/admin/products -> liste des produits avec pagination
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

    let query = supabaseAdmin
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
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const products = data?.map((product) => {
      const range = product.range as
        | { id: string; name: string; brand_id: string; brand: { id: string; name: string } | null }
        | null
      return {
        ...product,
        brand: range?.brand ?? null,
        range,
        image_url: product.product_images?.[0]?.url ?? null,
      }
    })

    return NextResponse.json({
      products,
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    return apiError('Erreur lors de la récupération des produits', error, 500)
  }
}

// POST /api/admin/products -> création d'un produit avec upload d'image
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const parsed = parseBody(productCreate, body)
    if (!parsed.ok) return parsed.response
     
    const { brand_id, range_id, selectedTags, imageFile, ...productData } = body

    let imageUrl: string | null = null
    let brandName = ''

    if (brand_id) {
      const { data: brand } = await supabaseAdmin
        .from('brands')
        .select('name')
        .eq('id', brand_id)
        .single()
      brandName = brand?.name?.toLowerCase() || ''
    }

    if (imageFile && productData.slug) {
      const imageBuffer = Buffer.from(imageFile, 'base64')
      const imagePath = brandName
        ? `${brandName}/${productData.slug}.png`
        : `${productData.slug}.png`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('product-image')
        .upload(imagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('product-image')
        .getPublicUrl(imagePath)

      imageUrl = publicUrl
    }

    // Si pas de range_id explicite mais une marque, on prend la 1ère gamme de la marque.
    let effectiveRangeId: string | null = range_id ?? null
    if (!effectiveRangeId && brand_id) {
      const { data: availableRanges } = await supabaseAdmin
        .from('ranges')
        .select('id')
        .eq('brand_id', brand_id)
        .limit(1)
      effectiveRangeId = availableRanges?.[0]?.id ?? null
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        ...productData,
        currency: productData.currency || DEFAULT_CURRENCY,
        range_id: effectiveRangeId,
      })
      .select()
      .single()

    if (error) throw error

    if (product && imageUrl) {
      await supabaseAdmin
        .from('product_images')
        .insert({
          product_id: product.id,
          url: imageUrl,
          alt: `Image de ${productData.name}`,
        })
    }

    if (product && selectedTags && Array.isArray(selectedTags) && selectedTags.length > 0) {
      const productTagsData = selectedTags.map((tagId: string) => ({
        product_id: product.id,
        tag_id: tagId,
      }))

      await supabaseAdmin
        .from('product_tags')
        .insert(productTagsData)
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return apiError('Erreur lors de la création du produit', error, 500)
  }
}
