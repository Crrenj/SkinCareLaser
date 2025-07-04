import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    const { name, slug } = body

    // Valider les données
    if (!name || !slug) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Mettre à jour le tag
    const { data, error } = await supabase
      .from('tags')
      .update({ name, slug })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Erreur mise à jour tag:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur API mise à jour tag:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Supprimer le tag
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Erreur suppression tag:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API suppression tag:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
} 