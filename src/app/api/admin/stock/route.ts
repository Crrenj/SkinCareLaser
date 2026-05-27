import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, stockBody } from '@/lib/schemas'

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
        range:ranges(
          id,
          name,
          brand_id,
          brand:brands(id, name)
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
      const range = product.range as
        | { id: string; name: string; brand_id: string; brand: { id: string; name: string } | null }
        | null
      const brand = range?.brand || null
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
    logger.error('Erreur récupération stock:', error)
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
    const raw = await req.json()
    const parsed = parseBody(stockBody, raw)
    if (!parsed.ok) return parsed.response
    const { product_id, stock } = parsed.data

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ stock, updated_at: new Date().toISOString() })
      .eq('id', product_id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    logger.error('Erreur mise à jour stock:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du stock'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
