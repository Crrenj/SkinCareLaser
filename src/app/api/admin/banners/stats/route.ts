import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()
    
    const { bannerId, type } = body
    
    if (!bannerId || !type) {
      return NextResponse.json(
        { error: 'ID de bannière et type requis' },
        { status: 400 }
      )
    }
    
    if (!['view', 'click'].includes(type)) {
      return NextResponse.json(
        { error: 'Type doit être "view" ou "click"' },
        { status: 400 }
      )
    }
    
    const column = type === 'view' ? 'view_count' : 'click_count'
    
    const { data: banner, error } = await supabase
      .from('banners')
      .select('id, view_count, click_count')
      .eq('id', bannerId)
      .single()
    
    if (error || !banner) {
      return NextResponse.json(
        { error: 'Bannière non trouvée' },
        { status: 404 }
      )
    }
    
    const newCount = (banner[column] || 0) + 1
    
    const { error: updateError } = await supabase
      .from('banners')
      .update({ [column]: newCount })
      .eq('id', bannerId)
    
    if (updateError) {
      console.error('Erreur lors de la mise à jour des statistiques:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Statistiques mises à jour',
      [column]: newCount
    })
  } catch (error) {
    console.error('Erreur dans POST /api/admin/banners/stats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
} 