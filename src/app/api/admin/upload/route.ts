import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Client admin avec service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/admin/upload - Upload une image produit
 * Body: { file: base64, fileName: string, contentType: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const cookieStore = await cookies()
    const token = cookieStore.get('sb-access-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
    }

    // Récupérer les données du fichier
    const { file, fileName, contentType } = await req.json()
    const fileBuffer = Buffer.from(file, 'base64')

    // Upload vers le bucket
    const { data, error } = await supabaseAdmin.storage
      .from('product-image')
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: true // Remplace si existe déjà
      })

    if (error) throw error

    // Retourner l'URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('product-image')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl, path: data.path })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur upload' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/upload - Supprime une image
 * Query: ?path=chemin/image.png
 */
export async function DELETE(req: NextRequest) {
  try {
    // Même vérification admin
    const cookieStore = await cookies()
    const token = cookieStore.get('sb-access-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
    }

    // Récupérer le path depuis query params
    const path = req.nextUrl.searchParams.get('path')
    if (!path) {
      return NextResponse.json({ error: 'Path requis' }, { status: 400 })
    }

    // Supprimer du bucket
    const { error } = await supabaseAdmin.storage
      .from('product-image')
      .remove([path])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur suppression' },
      { status: 500 }
    )
  }
} 