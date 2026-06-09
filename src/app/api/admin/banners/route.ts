import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, bannerCreate, bannerUpdate } from '@/lib/schemas'
import { recordAuditLog } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    let query = supabaseAdmin
      .from('banners')
      .select('*')
      .order('position', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
      const now = new Date().toISOString().split('T')[0]
      query = query.or(`start_date.is.null,start_date.lte.${now}`)
      query = query.or(`end_date.is.null,end_date.gte.${now}`)
    }

    const { data: banners, error } = await query

    if (error) {
      logger.error('Erreur lors de la récupération des bannières:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ banners })
  } catch (error) {
    logger.error('Erreur dans GET /api/admin/banners:', error)
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
    const parsed = parseBody(bannerCreate, raw)
    if (!parsed.ok) return parsed.response
    const {
      title, description, image_url, link_url, link_text,
      banner_type, position, is_active, start_date, end_date,
      direction, attribution_name, attribution_title, attribution_photo_url,
    } = parsed.data

    const requiresImage = banner_type !== 'quote'
    const requiresDescription = banner_type !== 'quote'
    if (requiresDescription && !description) {
      return NextResponse.json({ error: 'Description requise pour ce type' }, { status: 400 })
    }
    if (requiresImage && !image_url) {
      return NextResponse.json({ error: 'Image requise pour ce type' }, { status: 400 })
    }

    let finalPosition = position
    if (!finalPosition) {
      const { data: lastBanner } = await supabaseAdmin
        .from('banners')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
      finalPosition = lastBanner?.[0]?.position ? lastBanner[0].position + 1 : 1
    }

    const { data: banner, error } = await supabaseAdmin
      .from('banners')
      .insert([{
        title, description, image_url, link_url, link_text,
        banner_type, position: finalPosition,
        is_active: is_active ?? true,
        start_date, end_date,
        direction: direction || null,
        attribution_name: attribution_name || null,
        attribution_title: attribution_title || null,
        attribution_photo_url: attribution_photo_url || null,
      }])
      .select()
      .single()

    if (error) {
      logger.error('Erreur lors de la création de la bannière:', error)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    recordAuditLog({
      actorId: auth.userId,
      action: 'create',
      entity: 'banner',
      entityId: banner?.id ?? null,
      summary: `Banner creado: ${title}`,
      diff: { title, banner_type, is_active: is_active ?? true, position: finalPosition },
    })

    return NextResponse.json({ banner }, { status: 201 })
  } catch (error) {
    logger.error('Erreur dans POST /api/admin/banners:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const raw = await request.json()
    const parsed = parseBody(bannerUpdate, raw)
    if (!parsed.ok) return parsed.response
    const {
      id, title, description, image_url, link_url, link_text,
      banner_type, position, is_active, start_date, end_date,
      direction, attribution_name, attribution_title, attribution_photo_url,
    } = parsed.data

    if (position !== undefined) {
      const { data: currentBanner } = await supabaseAdmin
        .from('banners')
        .select('position')
        .eq('id', id)
        .single()

      if (currentBanner && currentBanner.position !== position) {
        await supabaseAdmin.rpc('reorder_banners', {
          banner_id: id,
          old_position: currentBanner.position,
          new_position: position,
        })
      }
    }

    const { data: banner, error } = await supabaseAdmin
      .from('banners')
      .update({
        title, description, image_url, link_url, link_text,
        banner_type, position, is_active, start_date, end_date,
        direction: direction === undefined ? undefined : direction || null,
        attribution_name: attribution_name === undefined ? undefined : attribution_name || null,
        attribution_title: attribution_title === undefined ? undefined : attribution_title || null,
        attribution_photo_url: attribution_photo_url === undefined ? undefined : attribution_photo_url || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Erreur lors de la mise à jour de la bannière:', error)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    recordAuditLog({
      actorId: auth.userId,
      action: 'update',
      entity: 'banner',
      entityId: id,
      summary: `Banner actualizado: ${title ?? id.slice(0, 8)}`,
      diff: { title, banner_type, is_active, position },
    })

    return NextResponse.json({ banner })
  } catch (error) {
    logger.error('Erreur dans PUT /api/admin/banners:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de la bannière requis' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('banners').delete().eq('id', id)

    if (error) {
      logger.error('Erreur lors de la suppression de la bannière:', error)
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    recordAuditLog({
      actorId: auth.userId,
      action: 'delete',
      entity: 'banner',
      entityId: id,
      summary: `Banner eliminado (${id.slice(0, 8)})`,
      diff: { id },
    })

    return NextResponse.json({ message: 'Bannière supprimée avec succès' })
  } catch (error) {
    logger.error('Erreur dans DELETE /api/admin/banners:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
