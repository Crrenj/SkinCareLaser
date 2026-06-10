import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, tagTypePatch } from '@/lib/schemas'
import { recordAuditLog } from '@/lib/audit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const { id } = await params
    const raw = await request.json()
    const parsed = parseBody(tagTypePatch, raw)
    if (!parsed.ok) return parsed.response
    const { name, slug, icon, color } = parsed.data

    const { data, error } = await supabaseAdmin
      .from('tag_types')
      .update({ name, slug, icon, color })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Erreur mise à jour type de tag:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 })
      }
      return apiError('Erreur serveur', error, 500)
    }

    recordAuditLog({
      actorId: auth.userId,
      action: 'update',
      entity: 'tag_type',
      entityId: id,
      summary: `Tipo de etiqueta actualizado: ${name ?? id.slice(0, 8)}`,
      diff: { name, slug, icon, color },
    })

    return NextResponse.json(data)
  } catch (error) {
    logger.error('Erreur API mise à jour type de tag:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const { id } = await params

    const { data: tags, error: checkError } = await supabaseAdmin
      .from('tags')
      .select('id')
      .eq('tag_type_id', id)
      .limit(1)

    if (checkError) {
      logger.error('Erreur vérification tags:', checkError)
      return apiError('Erreur serveur', checkError, 500)
    }

    if (tags && tags.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer ce type car il contient des tags' },
        { status: 400 },
      )
    }

    const { error } = await supabaseAdmin.from('tag_types').delete().eq('id', id)

    if (error) {
      logger.error('Erreur suppression type de tag:', error)
      return apiError('Erreur serveur', error, 500)
    }

    recordAuditLog({
      actorId: auth.userId,
      action: 'delete',
      entity: 'tag_type',
      entityId: id,
      summary: `Tipo de etiqueta eliminado (${id.slice(0, 8)})`,
      diff: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur API suppression type de tag:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
