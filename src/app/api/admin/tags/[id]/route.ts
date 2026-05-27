import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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
    const body = await request.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('tags')
      .update({ name, slug })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Erreur mise à jour tag:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.error('Erreur API mise à jour tag:', error)
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

    const { error } = await supabaseAdmin.from('tags').delete().eq('id', id)

    if (error) {
      logger.error('Erreur suppression tag:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur API suppression tag:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
