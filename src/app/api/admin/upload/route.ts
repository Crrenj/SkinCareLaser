import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, uploadBody } from '@/lib/schemas'

/**
 * POST /api/admin/upload - Upload une image produit
 * Body: { file: base64, fileName: string, contentType: string }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const raw = await req.json()
    const parsed = parseBody(uploadBody, raw)
    if (!parsed.ok) return parsed.response
    const { file, fileName, contentType } = parsed.data
    const fileBuffer = Buffer.from(file, 'base64')

    const { data, error } = await supabaseAdmin.storage
      .from('product-image')
      .upload(fileName, fileBuffer, { contentType, upsert: true })

    if (error) throw error

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('product-image')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl, path: data.path })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur upload'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/upload?path=...
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const path = req.nextUrl.searchParams.get('path')
    if (!path) {
      return NextResponse.json({ error: 'Path requis' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.storage.from('product-image').remove([path])
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur suppression'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
