import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vérifier les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Accepter les deux noms possibles pour la clé de service
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configuration manquante:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  })
}

// Créer un client Supabase avec la clé service pour bypass RLS
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// GET /api/admin/products -> liste des produits avec pagination
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { 
        error: 'Configuration manquante', 
        message: 'SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY non configurée. Consultez GUIDE_ADMIN_PRODUCTS.md' 
      },
      { status: 500 }
    )
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    
    const offset = (page - 1) * limit
    
    // Requête de base - SANS !inner pour inclure tous les produits
    let query = supabaseAdmin
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
    
    // Recherche si nécessaire
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    // Pagination et tri
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    
    // Transformer les données pour inclure la marque
    const products = data?.map(product => ({
      ...product,
      brand: product.product_ranges?.[0]?.ranges?.brands || null,
      range: product.product_ranges?.[0]?.ranges || null,
      // Utiliser la première image de product_images ou fallback sur image_url
      image_url: product.product_images?.[0]?.url || product.image_url
    }))
    
    return NextResponse.json({
      products,
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

// POST /api/admin/products -> création d'un produit avec upload d'image
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { 
        error: 'Configuration manquante', 
        message: 'SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY non configurée. Consultez GUIDE_ADMIN_PRODUCTS.md' 
      },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    
    // Extraire brand_id, range_id, selectedTags et imageFile du body
    const { brand_id, range_id, selectedTags, imageFile, ...productData } = body
    
    let imageUrl = null
    let brandName = ''
    
    // Récupérer le nom de la marque si brand_id est fourni
    if (brand_id) {
      const { data: brand } = await supabaseAdmin
        .from('brands')
        .select('name')
        .eq('id', brand_id)
        .single()
      
      brandName = brand?.name?.toLowerCase() || ''
    }
    
    // Upload de l'image si fournie
    if (imageFile && productData.slug) {
      const imageBuffer = Buffer.from(imageFile, 'base64')
      // Créer le chemin avec le dossier de la marque si elle existe
      const imagePath = brandName 
        ? `${brandName}/${productData.slug}.png`
        : `${productData.slug}.png`
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('product-image')
        .upload(imagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        })
      
      if (uploadError) throw uploadError
      
      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('product-image')
        .getPublicUrl(imagePath)
      
      imageUrl = publicUrl
    }
    
    // Créer le produit (sans image_url)
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        ...productData,
        currency: productData.currency || 'DOP'
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Créer la relation avec la gamme si fournie
    if (product && range_id) {
      await supabaseAdmin
        .from('product_ranges')
        .insert({
          product_id: product.id,
          range_id: range_id
        })
    } else if (product && brand_id && !range_id) {
      // Si on a une marque mais pas de gamme, utiliser la première gamme disponible
      const { data: availableRanges } = await supabaseAdmin
        .from('ranges')
        .select('id')
        .eq('brand_id', brand_id)
        .limit(1)
      
      if (availableRanges && availableRanges.length > 0) {
        await supabaseAdmin
          .from('product_ranges')
          .insert({
            product_id: product.id,
            range_id: availableRanges[0].id
          })
      }
    }
    
    // Ajouter l'image dans product_images si elle existe
    if (product && imageUrl) {
      await supabaseAdmin
        .from('product_images')
        .insert({
          product_id: product.id,
          url: imageUrl,
          alt: `Image de ${productData.name}`
        })
    }

    // Ajouter les tags si fournis
    if (product && selectedTags && Array.isArray(selectedTags) && selectedTags.length > 0) {
      const productTagsData = selectedTags.map(tagId => ({
        product_id: product.id,
        tag_id: tagId
      }))
      
      await supabaseAdmin
        .from('product_tags')
        .insert(productTagsData)
    }
    
    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du produit' },
      { status: 500 }
    )
  }
} 