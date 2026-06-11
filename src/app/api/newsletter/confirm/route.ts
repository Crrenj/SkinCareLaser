import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'missing_token' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  const ip = getClientIp(request)
  const { allowed, retryAfter } = await checkRateLimit(`newsletter-confirm:${ip}`, 10, 60)
  if (!allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  const { data, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .update({
      confirmed_at: new Date().toISOString(),
      confirmation_token: null,
    })
    .eq('confirmation_token', token)
    .is('confirmed_at', null)
    .gt('token_expires_at', new Date().toISOString())
    .select('id, email, lang')
    .maybeSingle()

  if (error) {
    logger.error('[/api/newsletter/confirm]', error)
    return NextResponse.json({ error: 'confirm_failed' }, { status: 500 })
  }

  if (!data) {
    // Token déjà consommé / expiré : la langue de l'abonné n'est plus accessible
    // (token nullifié à la confirmation) → on retombe sur 'fr'.
    return NextResponse.redirect(new URL('/fr?newsletter=already', request.url))
  }

  // Redirige vers la home dans la langue choisie par l'abonné (fallback fr).
  const lang = data.lang === 'es' || data.lang === 'en' ? data.lang : 'fr'
  return NextResponse.redirect(new URL(`/${lang}?newsletter=confirmed`, request.url))
}
