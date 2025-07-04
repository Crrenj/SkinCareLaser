import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer tous les types de tags avec le nombre de tags
    const { data: tagTypes, error } = await supabase
      .from('tag_types')
      .select(`
        *,
        tags:tags(count)
      `)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erreur récupération types de tags:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tagTypes || [])
  } catch (error) {
    console.error('Erreur API types de tags:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()

    const { name, slug, icon, color, initial_tag } = body

    // Valider les données
    if (!name || !slug) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Créer le type de tag
    const { data: tagType, error: typeError } = await supabase
      .from('tag_types')
      .insert({ name, slug, icon, color })
      .select()
      .single()

    if (typeError) {
      console.error('Erreur création type de tag:', typeError)
      if (typeError.code === '23505') {
        return NextResponse.json({ error: 'Ce type existe déjà' }, { status: 409 })
      }
      return NextResponse.json({ error: typeError.message }, { status: 500 })
    }

    // Si un tag initial est fourni, le créer
    if (initial_tag && tagType) {
      const { error: tagError } = await supabase
        .from('tags')
        .insert({
          name: initial_tag.name,
          slug: initial_tag.slug,
          tag_type_id: tagType.id
        })

      if (tagError) {
        console.error('Erreur création tag initial:', tagError)
        // On ne retourne pas d'erreur car le type a été créé avec succès
      }
    }

    return NextResponse.json(tagType)
  } catch (error) {
    console.error('Erreur API création type de tag:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
} 