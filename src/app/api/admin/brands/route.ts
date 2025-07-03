import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vérifier les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Accepter les deux noms possibles pour la clé de service
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

// GET /api/admin/brands -> liste des marques avec leurs gammes
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { 
        error: 'Configuration manquante', 
        message: 'SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY non configurée. Consultez GUIDE_ADMIN_PRODUCTS.md' 
      },
      { status: 500 }
    )
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('*, ranges(*)')
      .order('name')
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des marques' },
      { status: 500 }
    )
  }
} 