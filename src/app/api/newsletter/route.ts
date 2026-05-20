import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

/**
 * POST /api/newsletter — inscription newsletter.
 *
 * Body : { email: string, lang?: 'fr'|'es'|'en' }
 * Rate-limit : 3 req/min/IP (un user qui spam le formulaire = clairement abus).
 * Idempotent : si l'email existe déjà (conflit UNIQUE), on retourne 200
 * comme si l'inscription venait d'être faite (évite la leak existence).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  const ip = getClientIp(request)
  const { allowed, retryAfter } = await checkRateLimit(`newsletter:${ip}`, 3, 60)
  if (!allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  let body: { email?: string; lang?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const lang = body.lang === 'es' || body.lang === 'en' ? body.lang : 'fr'

  if (!email || !EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

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
