import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, bannerStatsBody } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const raw = await request.json()
    const parsed = parseBody(bannerStatsBody, raw)
    if (!parsed.ok) return parsed.response
    const { bannerId, type } = parsed.data

    const column = type === 'view' ? 'view_count' : 'click_count'

    const { data: banner, error } = await supabaseAdmin
      .from('banners')
      .select('id, view_count, click_count')
      .eq('id', bannerId)
      .single()

    if (error || !banner) {
      return NextResponse.json({ error: 'Bannière non trouvée' }, { status: 404 })
    }

    const newCount = (banner[column] || 0) + 1

    const updatePayload = column === 'view_count'
      ? { view_count: newCount }
      : { click_count: newCount }

    const { error: updateError } = await supabaseAdmin
      .from('banners')
      .update(updatePayload)
      .eq('id', bannerId)

    if (updateError) {
      logger.error('Erreur lors de la mise à jour des statistiques:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Statistiques mises à jour',
      [column]: newCount,
    })
  } catch (error) {
    logger.error('Erreur dans POST /api/admin/banners/stats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
