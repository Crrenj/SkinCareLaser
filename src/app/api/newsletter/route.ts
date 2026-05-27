import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { checkOrigin } from '@/lib/csrf'

/**
 * /api/newsletter — gestion newsletter.
 *
 * POST  : inscription (publique + rate-limited, idempotent sur UNIQUE conflict)
 * GET   : check si l'user connecté est abonné (auth required)
 * DELETE: désabonnement de l'email de l'user connecté (auth required)
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const originError = checkOrigin(request)
  if (originError) return originError

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  let body: { email?: string; lang?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  let email = (body.email ?? '').trim().toLowerCase()

  // Body sans email → si l'user est connecté, on remplit avec sa session
  // (réabonnement depuis /account/preferences). Sinon, c'est le flow public.
  if (!email) {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.email) {
      email = user.email.toLowerCase()
    }
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  // Rate-limit appliqué uniquement sur le flow public (body.email fourni)
  if (body.email) {
    const ip = getClientIp(request)
    const { allowed, retryAfter } = await checkRateLimit(`newsletter:${ip}`, 3, 60)
    if (!allowed) {
      return NextResponse.json(
        { error: 'rate_limited', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }
  }

  const lang = body.lang === 'es' || body.lang === 'en' ? body.lang : 'fr'
  const ip = getClientIp(request)
  const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null

  const { error } = await supabaseAdmin.from('newsletter_subscribers').insert({
    email,
    lang,
    ip,
    user_agent: userAgent,
  })

  // 23505 = unique violation → email déjà inscrit, on traite comme un succès
  // pour ne pas leak l'existence d'un compte. Toute autre erreur = 500.
  if (error && error.code !== '23505') {
    console.error('[/api/newsletter]', error)
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/** GET — renvoie { subscribed: boolean } pour l'email de l'user connecté. */
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('id')
    .eq('email', user.email.toLowerCase())
    .maybeSingle()

  if (error) {
    console.error('[/api/newsletter GET]', error)
    return NextResponse.json({ error: 'select_failed' }, { status: 500 })
  }

  return NextResponse.json({ subscribed: !!data })
}

/** DELETE — désabonne l'email de l'user connecté. Idempotent. */
export async function DELETE() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .delete()
    .eq('email', user.email.toLowerCase())

  if (error) {
    console.error('[/api/newsletter DELETE]', error)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
