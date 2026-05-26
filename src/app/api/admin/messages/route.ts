import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: messages, error, count } = await query

    if (error) {
      console.error('Erreur récupération messages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: statsData } = await supabaseAdmin.rpc('get_messages_stats')

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats: statsData,
    })
  } catch (error) {
    console.error('Erreur API messages:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { id, status, priority, admin_notes, replied_at } = body

    const updateData: {
      updated_at: string
      status?: string
      priority?: string
      admin_notes?: string
      replied_at?: string
      replied_by?: string
    } = {
      updated_at: new Date().toISOString(),
    }

    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes
    if (replied_at) {
      updateData.replied_at = replied_at
      updateData.replied_by = auth.userId
    }

    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur mise à jour message:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: data })
  } catch (error) {
    console.error('Erreur API PATCH messages:', error)
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
      return NextResponse.json({ error: 'ID du message requis' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('contact_messages').delete().eq('id', id)

    if (error) {
      console.error('Erreur suppression message:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API DELETE messages:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
