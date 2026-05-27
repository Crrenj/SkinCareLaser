import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'missing_token' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  const { data, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .update({
      confirmed_at: new Date().toISOString(),
      confirmation_token: null,
    })
    .eq('confirmation_token', token)
    .is('confirmed_at', null)
    .select('id, email')
    .maybeSingle()

  if (error) {
    logger.error('[/api/newsletter/confirm]', error)
    return NextResponse.json({ error: 'confirm_failed' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.redirect(new URL('/fr?newsletter=already', request.url))
  }

  return NextResponse.redirect(new URL('/fr?newsletter=confirmed', request.url))
}
