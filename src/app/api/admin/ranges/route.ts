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
    const brandId = req.nextUrl.searchParams.get('brand_id')

    let query = supabaseAdmin
      .from('ranges')
      .select('*, brands(*)')
      .order('name')

    if (brandId) query = query.eq('brand_id', brandId)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des gammes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { name, slug, brand_id } = body

    if (!name || !slug || !brand_id) {
      return NextResponse.json(
        { error: 'Le nom, le slug et la marque sont requis' },
        { status: 400 },
      )
    }

    const { data: brand, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('id', brand_id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 })
    }

    const { data: range, error } = await supabaseAdmin
      .from('ranges')
      .insert({ name: name.trim(), slug: slug.trim().toLowerCase(), brand_id })
      .select('*, brands(*)')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Une gamme avec ce slug existe déjà pour cette marque' },
          { status: 409 },
        )
      }
      throw error
    }

    return NextResponse.json(range, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création de la gamme'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
