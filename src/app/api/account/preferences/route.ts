import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

const ALLOWED_LOCALES = ['fr', 'en', 'es'] as const
type Locale = (typeof ALLOWED_LOCALES)[number]

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (ALLOWED_LOCALES as readonly string[]).includes(value)
}

/**
 * PATCH /api/account/preferences
 * Body : { preferred_locale: 'fr'|'en'|'es'|null }
 * Auth required. Met à jour profiles.preferred_locale de l'user connecté.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: { preferred_locale?: string | null } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const value = body.preferred_locale
  if (value !== null && !isLocale(value)) {
    return NextResponse.json({ error: 'invalid_locale' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ preferred_locale: value })
    .eq('id', user.id)

  if (error) {
    console.error('[/api/account/preferences]', error)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
