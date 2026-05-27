import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const { data: tags, error } = await supabaseAdmin
      .from('tags')
      .select('*')
      .order('tag_type_id', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      logger.error('Erreur récupération tags:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tags || [])
  } catch (error) {
    logger.error('Erreur API tags:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { name, slug, tag_type_id } = body

    if (!name || !slug || !tag_type_id) {
      return NextResponse.json(
        { error: 'Données manquantes (nom, slug, et type requis)' },
        { status: 400 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from('tags')
      .insert({ name, slug, tag_type_id })
      .select()
      .single()

    if (error) {
      logger.error('Erreur création tag:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ce tag existe déjà' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.error('Erreur API création tag:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
