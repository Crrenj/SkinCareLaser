import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, brandBody } from '@/lib/schemas'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('*, ranges(*)')
      .order('name')

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des marques'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const raw = await req.json()
    const parsed = parseBody(brandBody, raw)
    if (!parsed.ok) return parsed.response
    const { name, slug } = parsed.data

    const { data: brand, error } = await supabaseAdmin
      .from('brands')
      .insert({ name: name.trim(), slug: slug.trim().toLowerCase() })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Une marque avec ce nom ou ce slug existe déjà' },
          { status: 409 },
        )
      }
      throw error
    }

    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création de la marque'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
