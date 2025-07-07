import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vérifier les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configuration manquante:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  })
}

// Créer un client Supabase avec la clé service
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// PATCH /api/admin/brands/[id] -> modification d'une marque
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const body = await req.json()
    const { name, slug } = body

    // Validation des données
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Le nom et le slug sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que la marque existe
    const { data: existingBrand, error: checkError } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingBrand) {
      return NextResponse.json(
        { error: 'Marque non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour la marque
    const { data: brand, error } = await supabaseAdmin
      .from('brands')
      .update({
        name: name.trim(),
        slug: slug.trim().toLowerCase()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Une marque avec ce nom ou ce slug existe déjà' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json(brand)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification de la marque' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/brands/[id] -> suppression d'une marque
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    // Vérifier que la marque existe
    const { data: existingBrand, error: checkError } = await supabaseAdmin
      .from('brands')
      .select('id, name')
      .eq('id', id)
      .single()

    if (checkError || !existingBrand) {
      return NextResponse.json(
        { error: 'Marque non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier s'il y a des gammes associées
    const { data: ranges, error: rangesError } = await supabaseAdmin
      .from('ranges')
      .select('id')
      .eq('brand_id', id)
      .limit(1)

    if (rangesError) {
      throw rangesError
    }

    if (ranges && ranges.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer cette marque car elle contient des gammes. Supprimez d\'abord les gammes associées.' },
        { status: 400 }
      )
    }

    // Vérifier s'il y a des produits associés via les gammes
    const { data: products, error: productsError } = await supabaseAdmin
      .from('product_ranges')
      .select('product_id, ranges!inner(brand_id)')
      .eq('ranges.brand_id', id)
      .limit(1)

    if (productsError) {
      throw productsError
    }

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer cette marque car elle est associée à des produits. Supprimez d\'abord les produits associés.' },
        { status: 400 }
      )
    }

    // Supprimer la marque
    const { error } = await supabaseAdmin
      .from('brands')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: `Marque "${existingBrand.name}" supprimée avec succès` 
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression de la marque' },
      { status: 500 }
    )
  }
} 