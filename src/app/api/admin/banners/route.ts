import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// 3 nouveaux types (sprint 2 livrable 4) + 6 anciens conserves pour
// retrocompat des lignes DB existantes. Le composant Banner les
// normalise vers les 3 nouveaux a l affichage.
const VALID_BANNER_TYPES = [
  'editorial',
  'hero',
  'quote',
  'image_left',
  'image_right',
  'image_full',
  'card_style',
  'minimal',
  'gradient_overlay',
]

const VALID_DIRECTIONS = ['left', 'right']

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
      console.error('Erreur lors de la récupération des bannières:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Erreur dans GET /api/admin/banners:', error)
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
    const {
      title, description, image_url, link_url, link_text,
      banner_type, position, is_active, start_date, end_date,
      direction, attribution_name, attribution_title, attribution_photo_url,
    } = body

    // Quote n'a pas besoin de description ni d'image (juste le titre = citation)
    const requiresImage = banner_type !== 'quote'
    const requiresDescription = banner_type !== 'quote'

    if (!title || !banner_type) {
      return NextResponse.json(
        { error: 'Titre et type de bannière sont requis' },
        { status: 400 },
      )
    }
    if (requiresDescription && !description) {
      return NextResponse.json(
        { error: 'Description requise pour ce type' },
        { status: 400 },
      )
    }
    if (requiresImage && !image_url) {
      return NextResponse.json(
        { error: 'Image requise pour ce type' },
        { status: 400 },
      )
    }

    if (!VALID_BANNER_TYPES.includes(banner_type)) {
      return NextResponse.json({ error: 'Type de bannière invalide' }, { status: 400 })
    }

    if (direction && !VALID_DIRECTIONS.includes(direction)) {
      return NextResponse.json({ error: 'Direction invalide (left|right)' }, { status: 400 })
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
      console.error('Erreur lors de la création de la bannière:', error)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({ banner }, { status: 201 })
  } catch (error) {
    console.error('Erreur dans POST /api/admin/banners:', error)
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
    const body = await request.json()
    const {
      id, title, description, image_url, link_url, link_text,
      banner_type, position, is_active, start_date, end_date,
      direction, attribution_name, attribution_title, attribution_photo_url,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de la bannière requis' }, { status: 400 })
    }

    if (banner_type && !VALID_BANNER_TYPES.includes(banner_type)) {
      return NextResponse.json({ error: 'Type de bannière invalide' }, { status: 400 })
    }

    if (direction && !VALID_DIRECTIONS.includes(direction)) {
      return NextResponse.json({ error: 'Direction invalide (left|right)' }, { status: 400 })
    }

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
      console.error('Erreur lors de la mise à jour de la bannière:', error)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Erreur dans PUT /api/admin/banners:', error)
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
      console.error('Erreur lors de la suppression de la bannière:', error)
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Bannière supprimée avec succès' })
  } catch (error) {
    console.error('Erreur dans DELETE /api/admin/banners:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
