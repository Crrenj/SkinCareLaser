import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, postCreate, postUpdate, postDelete } from '@/lib/schemas'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const sp = req.nextUrl.searchParams
  const page = parseInt(sp.get('page') || '1')
  const limit = parseInt(sp.get('limit') || '50')
  const offset = (page - 1) * limit

  const { data, error, count } = await supabaseAdmin
    .from('posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    logger.error('GET /api/admin/posts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data, totalCount: count ?? 0 })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const parsed = parseBody(postCreate, await req.json())
  if (!parsed.ok) return parsed.response

  const payload = {
    ...parsed.data,
    published_at: parsed.data.is_published && !parsed.data.published_at
      ? new Date().toISOString()
      : parsed.data.published_at ?? null,
  }

  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert(payload)
    .select()
    .single()

  if (error) {
    logger.error('POST /api/admin/posts:', error)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Un article avec ce slug existe déjà' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const parsed = parseBody(postUpdate, await req.json())
  if (!parsed.ok) return parsed.response

  const { id, ...fields } = parsed.data

  if (fields.is_published && !fields.published_at) {
    const { data: existing } = await supabaseAdmin
      .from('posts')
      .select('published_at')
      .eq('id', id)
      .single()
    if (!existing?.published_at) {
      fields.published_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabaseAdmin
    .from('posts')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('PATCH /api/admin/posts:', error)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Un article avec ce slug existe déjà' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const parsed = parseBody(postDelete, await req.json())
  if (!parsed.ok) return parsed.response
  const { id } = parsed.data

  const { error } = await supabaseAdmin.from('posts').delete().eq('id', id)
  if (error) {
    logger.error('DELETE /api/admin/posts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
