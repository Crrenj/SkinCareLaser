import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, tagBody } from '@/lib/schemas'

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
    const raw = await request.json()
    const parsed = parseBody(tagBody, raw)
    if (!parsed.ok) return parsed.response
    const { name, slug, tag_type_id } = parsed.data

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
