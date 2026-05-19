import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function getStockStatus(currentStock: number, minStock = 10): 'ok' | 'low' | 'out' {
  if (currentStock === 0) return 'out'
  if (currentStock <= minStock) return 'low'
  return 'ok'
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const status = searchParams.get('status') || 'all'

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

    if (search) query = query.or(`name.ilike.%${search}%`)

    const validSortColumns = ['name', 'stock', 'price', 'updated_at']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name'
    const ascending = sortOrder === 'asc'
    query = query.order(sortColumn, { ascending })

    const { data: products, error } = await query
    if (error) throw error

    const stockItems = (products || []).map((product) => {
      const range = product.product_ranges?.[0]?.ranges as { id?: string; name?: string; brands?: { id?: string; name?: string } | null } | null | undefined
      const brand = range?.brands || null
      const itemStatus = getStockStatus(product.stock ?? 0)

      return {
        id: product.id,
        product_id: product.id,
        product_name: product.name,
        current_stock: product.stock,
        last_updated: product.updated_at,
        status: itemStatus,
        brand_name: brand?.name || null,
        range_name: range?.name || null,
        price: product.price,
        currency: product.currency,
      }
    })

    const filteredItems = status === 'all'
      ? stockItems
      : stockItems.filter((item) => item.status === status)

    const stats = {
      total: stockItems.length,
      ok: stockItems.filter((item) => item.status === 'ok').length,
      low: stockItems.filter((item) => item.status === 'low').length,
      out: stockItems.filter((item) => item.status === 'out').length,
    }

    return NextResponse.json({
      items: filteredItems,
      stats,
      totalCount: filteredItems.length,
    })
  } catch (error) {
    console.error('Erreur récupération stock:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du stock'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { product_id, stock } = body

    if (!product_id || stock === undefined) {
      return NextResponse.json({ error: 'product_id et stock sont requis' }, { status: 400 })
    }

    if (stock < 0) {
      return NextResponse.json({ error: 'Le stock ne peut pas être négatif' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ stock, updated_at: new Date().toISOString() })
      .eq('id', product_id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    console.error('Erreur mise à jour stock:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du stock'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
