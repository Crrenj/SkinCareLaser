import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    
    let query = supabase
      .from('banners')
      .select('*')
      .order('position', { ascending: true })
    
    if (activeOnly) {
      query = query.eq('is_active', true)
      
      // Filtrer par dates si active only
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
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()
    
    const {
      title,
      description,
      image_url,
      link_url,
      link_text,
      banner_type,
      position,
      is_active,
      start_date,
      end_date
    } = body
    
    // Validation des données
    if (!title || !description || !image_url || !banner_type) {
      return NextResponse.json(
        { error: 'Titre, description, image et type de bannière sont requis' },
        { status: 400 }
      )
    }
    
    if (!['image_left', 'image_right', 'image_full', 'card_style', 'minimal', 'gradient_overlay'].includes(banner_type)) {
      return NextResponse.json(
        { error: 'Type de bannière invalide' },
        { status: 400 }
      )
    }
    
    // Si aucune position n'est spécifiée, prendre la suivante
    let finalPosition = position
    if (!finalPosition) {
      const { data: lastBanner } = await supabase
        .from('banners')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
      
      finalPosition = lastBanner?.[0]?.position ? lastBanner[0].position + 1 : 1
    }
    
    const { data: banner, error } = await supabase
      .from('banners')
      .insert([{
        title,
        description,
        image_url,
        link_url,
        link_text,
        banner_type,
        position: finalPosition,
        is_active: is_active ?? true,
        start_date,
        end_date
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
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()
    
    const {
      id,
      title,
      description,
      image_url,
      link_url,
      link_text,
      banner_type,
      position,
      is_active,
      start_date,
      end_date
    } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID de la bannière requis' }, { status: 400 })
    }
    
    // Validation des données
    if (banner_type && !['image_left', 'image_right', 'image_full', 'card_style', 'minimal', 'gradient_overlay'].includes(banner_type)) {
      return NextResponse.json(
        { error: 'Type de bannière invalide' },
        { status: 400 }
      )
    }

    // Si la position change, réorganiser les autres bannières
    if (position !== undefined) {
      const { data: currentBanner } = await supabase
        .from('banners')
        .select('position')
        .eq('id', id)
        .single()

      if (currentBanner && currentBanner.position !== position) {
        // Décaler les autres bannières
        await supabase.rpc('reorder_banners', {
          banner_id: id,
          old_position: currentBanner.position,
          new_position: position
        })
      }
    }
    
    const { data: banner, error } = await supabase
      .from('banners')
      .update({
        title,
        description,
        image_url,
        link_url,
        link_text,
        banner_type,
        position,
        is_active,
        start_date,
        end_date
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
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID de la bannière requis' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)
    
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