import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, rangeBody } from '@/lib/schemas'
import { apiError } from '@/lib/apiError'
import { recordAuditLog } from '@/lib/audit'

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
    return apiError('Erreur lors de la récupération des gammes', error, 500)
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const raw = await req.json()
    const parsed = parseBody(rangeBody, raw)
    if (!parsed.ok) return parsed.response
    const { name, slug, brand_id } = parsed.data

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

    recordAuditLog({
      actorId: auth.userId,
      action: 'create',
      entity: 'range',
      entityId: range?.id ?? null,
      summary: `Gama creada: ${name.trim()}`,
      diff: { name: name.trim(), slug: slug.trim().toLowerCase(), brand_id },
    })

    return NextResponse.json(range, { status: 201 })
  } catch (error) {
    return apiError('Erreur lors de la création de la gamme', error, 500)
  }
}
