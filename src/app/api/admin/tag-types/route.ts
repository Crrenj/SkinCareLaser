import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, tagTypeBody } from '@/lib/schemas'
import { recordAuditLog } from '@/lib/audit'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const { data: tagTypes, error } = await supabaseAdmin
      .from('tag_types')
      .select(`
        *,
        tags:tags(count)
      `)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Erreur récupération types de tags:', error)
      return apiError('Erreur serveur', error, 500)
    }

    return NextResponse.json(tagTypes || [])
  } catch (error) {
    logger.error('Erreur API types de tags:', error)
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
    const parsed = parseBody(tagTypeBody, raw)
    if (!parsed.ok) return parsed.response
    const { name, slug, icon, color, initial_tag } = parsed.data

    const { data: tagType, error: typeError } = await supabaseAdmin
      .from('tag_types')
      .insert({ name, slug, icon, color })
      .select()
      .single()

    if (typeError) {
      logger.error('Erreur création type de tag:', typeError)
      if (typeError.code === '23505') {
        return NextResponse.json({ error: 'Ce type existe déjà' }, { status: 409 })
      }
      return NextResponse.json({ error: typeError.message }, { status: 500 })
    }

    if (initial_tag && tagType) {
      const { error: tagError } = await supabaseAdmin
        .from('tags')
        .insert({
          name: initial_tag.name,
          slug: initial_tag.slug,
          tag_type_id: tagType.id,
        })

      if (tagError) {
        logger.error('Erreur création tag initial:', tagError)
        // On ne retourne pas d'erreur car le type a été créé avec succès
      }
    }

    recordAuditLog({
      actorId: auth.userId,
      action: 'create',
      entity: 'tag_type',
      entityId: tagType?.id ?? null,
      summary: `Tipo de etiqueta creado: ${name}`,
      diff: { name, slug, icon, color },
    })

    return NextResponse.json(tagType)
  } catch (error) {
    logger.error('Erreur API création type de tag:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
