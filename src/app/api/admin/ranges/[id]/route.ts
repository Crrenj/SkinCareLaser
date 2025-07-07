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

// PATCH /api/admin/ranges/[id] -> modification d'une gamme
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
    const { name, slug, brand_id } = body

    // Validation des données
    if (!name || !slug || !brand_id) {
      return NextResponse.json(
        { error: 'Le nom, le slug et la marque sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que la gamme existe
    const { data: existingRange, error: checkError } = await supabaseAdmin
      .from('ranges')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingRange) {
      return NextResponse.json(
        { error: 'Gamme non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que la marque existe
    const { data: brand, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('id', brand_id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json(
        { error: 'Marque non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour la gamme
    const { data: range, error } = await supabaseAdmin
      .from('ranges')
      .update({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        brand_id
      })
      .eq('id', id)
      .select('*, brands(*)')
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Une gamme avec ce slug existe déjà pour cette marque' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json(range)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification de la gamme' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/ranges/[id] -> suppression d'une gamme
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

    // Vérifier que la gamme existe
    const { data: existingRange, error: checkError } = await supabaseAdmin
      .from('ranges')
      .select('id, name, brands(name)')
      .eq('id', id)
      .single()

    if (checkError || !existingRange) {
      return NextResponse.json(
        { error: 'Gamme non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier s'il y a des produits associés
    const { data: products, error: productsError } = await supabaseAdmin
      .from('product_ranges')
      .select('product_id')
      .eq('range_id', id)
      .limit(1)

    if (productsError) {
      throw productsError
    }

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer cette gamme car elle est associée à des produits. Supprimez d\'abord les produits associés.' },
        { status: 400 }
      )
    }

    // Supprimer la gamme
    const { error } = await supabaseAdmin
      .from('ranges')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: `Gamme "${existingRange.name}" supprimée avec succès` 
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression de la gamme' },
      { status: 500 }
    )
  }
} 