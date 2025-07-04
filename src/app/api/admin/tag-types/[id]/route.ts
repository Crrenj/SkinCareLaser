import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    const { id } = await params
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    const { name, slug, icon, color } = body

    // Valider les données
    if (!name || !slug) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Mettre à jour le type de tag
    const { data, error } = await supabase
      .from('tag_types')
      .update({ name, slug, icon, color })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur mise à jour type de tag:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur API mise à jour type de tag:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    const { id } = await params
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Vérifier s'il y a des tags associés
    const { data: tags, error: checkError } = await supabase
      .from('tags')
      .select('id')
      .eq('tag_type_id', id)
      .limit(1)

    if (checkError) {
      console.error('Erreur vérification tags:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (tags && tags.length > 0) {
      return NextResponse.json({ 
        error: 'Impossible de supprimer ce type car il contient des tags' 
      }, { status: 400 })
    }

    // Supprimer le type de tag
    const { error } = await supabase
      .from('tag_types')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur suppression type de tag:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API suppression type de tag:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
} 