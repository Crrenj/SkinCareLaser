import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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
    const body = await req.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Le nom et le slug sont requis' }, { status: 400 })
    }

    const { data: existingBrand, error: checkError } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingBrand) {
      return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 })
    }

    const { data: brand, error } = await supabaseAdmin
      .from('brands')
      .update({ name: name.trim(), slug: slug.trim().toLowerCase() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Une marque avec ce nom ou ce slug existe déjà' },
          { status: 409 },
        )
      }
      throw error
    }

    return NextResponse.json(brand)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la modification de la marque'
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

    const { data: existingBrand, error: checkError } = await supabaseAdmin
      .from('brands')
      .select('id, name')
      .eq('id', id)
      .single()

    if (checkError || !existingBrand) {
      return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 })
    }

    const { data: ranges, error: rangesError } = await supabaseAdmin
      .from('ranges')
      .select('id')
      .eq('brand_id', id)
      .limit(1)

    if (rangesError) throw rangesError

    if (ranges && ranges.length > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer cette marque car elle contient des gammes. Supprimez d'abord les gammes associées." },
        { status: 400 },
      )
    }

    const { data: products, error: productsError } = await supabaseAdmin
      .from('product_ranges')
      .select('product_id, ranges!inner(brand_id)')
      .eq('ranges.brand_id', id)
      .limit(1)

    if (productsError) throw productsError

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer cette marque car elle est associée à des produits. Supprimez d'abord les produits associés." },
        { status: 400 },
      )
    }

    const { error } = await supabaseAdmin.from('brands').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Marque "${existingBrand.name}" supprimée avec succès`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la suppression de la marque'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
