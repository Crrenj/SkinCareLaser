import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, brandBody } from '@/lib/schemas'
import { apiError } from '@/lib/apiError'
import { recordAuditLog } from '@/lib/audit'

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
    const parsed = parseBody(brandBody, raw)
    if (!parsed.ok) return parsed.response
    const { name, slug } = parsed.data

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

    recordAuditLog({
      actorId: auth.userId,
      action: 'update',
      entity: 'brand',
      entityId: id,
      summary: `Marca actualizada: ${name.trim()}`,
      diff: { name: name.trim(), slug: slug.trim().toLowerCase() },
    })

    return NextResponse.json(brand)
  } catch (error) {
    return apiError('Erreur lors de la modification de la marque', error, 500)
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

    // Vérifie qu'aucun produit n'utilise une range de cette marque.
    // (Depuis la migration `products.range_id`, on remonte par les ranges
    // de la marque et on cherche un produit qui pointe sur l'une d'elles.)
    const { data: brandRanges, error: brandRangesError } = await supabaseAdmin
      .from('ranges')
      .select('id')
      .eq('brand_id', id)

    if (brandRangesError) throw brandRangesError

    const rangeIds = (brandRanges ?? []).map((r) => r.id)
    const { data: products, error: productsError } =
      rangeIds.length > 0
        ? await supabaseAdmin
            .from('products')
            .select('id')
            .in('range_id', rangeIds)
            .limit(1)
        : { data: [], error: null }

    if (productsError) throw productsError

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer cette marque car elle est associée à des produits. Supprimez d'abord les produits associés." },
        { status: 400 },
      )
    }

    const { error } = await supabaseAdmin.from('brands').delete().eq('id', id)
    if (error) throw error

    recordAuditLog({
      actorId: auth.userId,
      action: 'delete',
      entity: 'brand',
      entityId: id,
      summary: `Marca eliminada: ${existingBrand.name}`,
      diff: { id, name: existingBrand.name },
    })

    return NextResponse.json({
      success: true,
      message: `Marque "${existingBrand.name}" supprimée avec succès`,
    })
  } catch (error) {
    return apiError('Erreur lors de la suppression de la marque', error, 500)
  }
}
