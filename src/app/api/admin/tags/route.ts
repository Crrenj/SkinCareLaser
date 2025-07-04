import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer tous les tags
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('tag_type', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Erreur récupération tags:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tags || [])
  } catch (error) {
    console.error('Erreur API tags:', error)
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

    const { name, slug, tag_type } = body

    // Valider les données
    if (!name || !slug || !tag_type) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Valider le type de tag
    const validTypes = ['category', 'need', 'skin_type', 'ingredient']
    if (!validTypes.includes(tag_type)) {
      return NextResponse.json({ error: 'Type de tag invalide' }, { status: 400 })
    }

    // Créer le tag
    const { data, error } = await supabase
      .from('tags')
      .insert({ name, slug, tag_type })
      .select()
      .single()

    if (error) {
      console.error('Erreur création tag:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Ce tag existe déjà' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur API création tag:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
} 