import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, rangeBody } from '@/lib/schemas'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const { id } = await params
    const raw = await req.json()
    const parsed = parseBody(rangeBody, raw)
    if (!parsed.ok) return parsed.response
    const { name, slug, brand_id } = parsed.data

    const { data: existingRange, error: checkError } = await supabaseAdmin
      .from('ranges')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingRange) {
      return NextResponse.json({ error: 'Gamme non trouvée' }, { status: 404 })
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
      .update({ name: name.trim(), slug: slug.trim().toLowerCase(), brand_id })
      .eq('id', id)
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

    return NextResponse.json(range)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la modification de la gamme'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const { id } = await params

    const { data: existingRange, error: checkError } = await supabaseAdmin
      .from('ranges')
      .select('id, name, brands(name)')
      .eq('id', id)
      .single()

    if (checkError || !existingRange) {
      return NextResponse.json({ error: 'Gamme non trouvée' }, { status: 404 })
    }

    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('range_id', id)
      .limit(1)

    if (productsError) throw productsError

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer cette gamme car elle est associée à des produits. Supprimez d'abord les produits associés." },
        { status: 400 },
      )
    }

    const { error } = await supabaseAdmin.from('ranges').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Gamme "${existingRange.name}" supprimée avec succès`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la suppression de la gamme'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
