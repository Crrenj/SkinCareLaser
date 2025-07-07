import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configuration manquante:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  })
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Fonction pour déterminer le statut du stock
function getStockStatus(currentStock: number, minStock: number = 10): 'ok' | 'low' | 'out' {
  if (currentStock === 0) return 'out'
  if (currentStock <= minStock) return 'low'
  return 'ok'
}

// GET /api/admin/stock -> récupérer tous les produits avec leur stock
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { 
        error: 'Configuration manquante', 
        message: 'SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY non configurée' 
      },
      { status: 500 }
    )
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const status = searchParams.get('status') || 'all'
    
    // Requête pour récupérer les produits avec leurs informations de stock
    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        stock,
        price,
        currency,
        updated_at,
        product_ranges(
          range_id,
          ranges(
            id,
            name,
            brand_id,
            brands(id, name)
          )
        )
      `)
    
    // Filtrer par recherche si nécessaire
    if (search) {
      query = query.or(`name.ilike.%${search}%`)
    }
    
    // Tri
    const validSortColumns = ['name', 'stock', 'price', 'updated_at']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name'
    const ascending = sortOrder === 'asc'
    
    query = query.order(sortColumn, { ascending })
    
    const { data: products, error } = await query
    
    if (error) throw error
    
    // Transformer les données pour le format attendu
    const stockItems = products?.map(product => {
      const range = product.product_ranges?.[0]?.ranges
      const brand = (range as any)?.brands
      const status = getStockStatus(product.stock)
      
      return {
        id: product.id,
        product_id: product.id,
        product_name: product.name,
        current_stock: product.stock,
        last_updated: product.updated_at,
        status,
        brand_name: (brand as any)?.name || null,
        range_name: (range as any)?.name || null,
        price: product.price,
        currency: product.currency
      }
    }) || []
    
    // Filtrer par statut si nécessaire
    const filteredItems = status === 'all' 
      ? stockItems 
      : stockItems.filter(item => item.status === status)
    
    // Statistiques
    const stats = {
      total: stockItems.length,
      ok: stockItems.filter(item => item.status === 'ok').length,
      low: stockItems.filter(item => item.status === 'low').length,
      out: stockItems.filter(item => item.status === 'out').length
    }
    
    return NextResponse.json({
      items: filteredItems,
      stats,
      totalCount: filteredItems.length
    })
  } catch (error: any) {
    console.error('Erreur récupération stock:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération du stock' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/stock -> mettre à jour le stock d'un produit
export async function PUT(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { 
        error: 'Configuration manquante', 
        message: 'SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY non configurée' 
      },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { product_id, stock } = body
    
    if (!product_id || stock === undefined) {
      return NextResponse.json(
        { error: 'product_id et stock sont requis' },
        { status: 400 }
      )
    }
    
    if (stock < 0) {
      return NextResponse.json(
        { error: 'Le stock ne peut pas être négatif' },
        { status: 400 }
      )
    }
    
    // Mettre à jour le stock du produit
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ 
        stock: stock,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      product: data
    })
  } catch (error: any) {
    console.error('Erreur mise à jour stock:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du stock' },
      { status: 500 }
    )
  }
} 