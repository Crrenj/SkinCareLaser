import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vérifier les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configuration manquante:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  })
}

// Créer un client Supabase avec la clé service
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// GET /api/admin/ranges -> liste des gammes avec leurs marques
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { 
        error: 'Configuration manquante', 
        message: 'SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY non configurée' 
      },
      { status: 500 }
    )
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const brandId = searchParams.get('brand_id')
    
    let query = supabaseAdmin
      .from('ranges')
      .select('*, brands(*)')
      .order('name')
    
    // Filtrer par marque si spécifié
    if (brandId) {
      query = query.eq('brand_id', brandId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des gammes' },
      { status: 500 }
    )
  }
}

// POST /api/admin/ranges -> création d'une nouvelle gamme
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { 
        error: 'Configuration manquante', 
        message: 'SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY non configurée' 
      },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { name, slug, brand_id } = body

    // Validation des données
    if (!name || !slug || !brand_id) {
      return NextResponse.json(
        { error: 'Le nom, le slug et la marque sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que la marque existe
    const { data: brand, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('id', brand_id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json(
        { error: 'Marque non trouvée' },
        { status: 404 }
      )
    }

    // Créer la gamme
    const { data: range, error } = await supabaseAdmin
      .from('ranges')
      .insert({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        brand_id
      })
      .select('*, brands(*)')
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Une gamme avec ce slug existe déjà pour cette marque' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json(range, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la gamme' },
      { status: 500 }
    )
  }
} 