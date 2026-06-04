import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, uploadBody } from '@/lib/schemas'

const BUCKET = 'product-image'
// Doit rester aligné avec allowed_mime_types du bucket Storage.
const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
}
const MAX_BYTES = 5 * 1024 * 1024 // 5 Mo, aligné avec file_size_limit du bucket

/**
 * Détecte le type d'image réel via les magic-bytes (signatures de fichier).
 * Le `contentType` déclaré par le client est falsifiable ; on vérifie le
 * contenu réel pour empêcher l'upload d'un fichier exécutable (.html/.svg)
 * déguisé en image puis servi depuis un bucket public.
 */
function sniffImageType(buf: Buffer): 'png' | 'jpg' | 'webp' | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png'
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}

/**
 * POST /api/admin/upload — Upload une image (produit, blog, bannière).
 * Body: { file: base64, fileName: string, contentType: string, folder?: 'products'|'blog'|'banners' }
 * Renvoie l'URL publique. Le chemin est généré côté serveur (folder/uuid.ext)
 * pour éviter toute collision ou traversée de chemin.
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
    const { file, contentType, folder } = parsed.data

    const ext = EXT_BY_TYPE[contentType.toLowerCase()]
    if (!ext) {
      return NextResponse.json(
        { error: 'Format non supporté. Utilise PNG, JPG ou WebP.' },
        { status: 400 },
      )
    }

    const fileBuffer = Buffer.from(file, 'base64')
    if (fileBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Fichier vide' }, { status: 400 })
    }
    if (fileBuffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Image trop lourde (5 Mo maximum).' },
        { status: 413 },
      )
    }

    // Magic-bytes : le contenu réel doit correspondre au type déclaré.
    if (sniffImageType(fileBuffer) !== ext) {
      return NextResponse.json(
        { error: 'Le contenu du fichier ne correspond pas à une image PNG/JPG/WebP valide.' },
        { status: 400 },
      )
    }

    const path = `${folder}/${crypto.randomUUID()}.${ext}`

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, fileBuffer, { contentType, upsert: false })

    if (error) throw error

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(data.path)

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

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path])
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur suppression'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
