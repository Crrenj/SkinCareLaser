import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/admin/messages - Récupérer tous les messages
export async function GET(request: NextRequest) {
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

    // Filtrer par statut si spécifié
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: messages, error, count } = await query

    if (error) {
      console.error('Erreur récupération messages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Récupérer les statistiques
    const { data: statsData } = await supabaseAdmin.rpc('get_messages_stats')

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: statsData
    })

  } catch (error) {
    console.error('Erreur API messages:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/messages - Mettre à jour un message
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, priority, admin_notes, replied_at } = body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes
    if (replied_at) {
      updateData.replied_at = replied_at
      updateData.replied_by = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed' // Admin UUID
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
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/messages - Supprimer un message
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID du message requis' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('contact_messages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur suppression message:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur API DELETE messages:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 