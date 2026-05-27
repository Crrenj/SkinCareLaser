import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { checkOrigin } from '@/lib/csrf'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { randomBytes } from 'crypto'

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

  const useDoubleOptIn = !!resend && !!body.email

  const confirmationToken = useDoubleOptIn
    ? randomBytes(32).toString('hex')
    : null

  const { error } = await supabaseAdmin.from('newsletter_subscribers').insert({
    email,
    lang,
    ip,
    user_agent: userAgent,
    confirmed_at: useDoubleOptIn ? null : new Date().toISOString(),
    confirmation_token: confirmationToken,
  })

  if (error && error.code !== '23505') {
    logger.error('[/api/newsletter]', error)
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }

  if (useDoubleOptIn && resend && confirmationToken && error?.code !== '23505') {
    const baseUrl = request.headers.get('origin') ?? 'https://farmau.do'
    const confirmUrl = `${baseUrl}/api/newsletter/confirm?token=${confirmationToken}`
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: lang === 'es'
          ? 'Confirma tu suscripción · FARMAU'
          : lang === 'en'
            ? 'Confirm your subscription · FARMAU'
            : 'Confirmez votre inscription · FARMAU',
        html: `
          <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; margin-bottom: 16px;">FARMAU</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              ${lang === 'es'
                ? 'Haz clic abajo para confirmar tu suscripción a nuestra newsletter.'
                : lang === 'en'
                  ? 'Click below to confirm your newsletter subscription.'
                  : 'Cliquez ci-dessous pour confirmer votre inscription à notre newsletter.'}
            </p>
            <a href="${confirmUrl}"
               style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6B5B4F; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px;">
              ${lang === 'es' ? 'Confirmar' : lang === 'en' ? 'Confirm' : 'Confirmer'}
            </a>
          </div>
        `,
      })
    } catch (emailErr) {
      logger.error('[/api/newsletter] resend error:', emailErr)
    }
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
    logger.error('[/api/newsletter GET]', error)
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
    logger.error('[/api/newsletter DELETE]', error)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
