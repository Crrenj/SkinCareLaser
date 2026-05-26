import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { routing } from '@/i18n/routing'
import { ADMIN_LOCALE_COOKIE } from '@/i18n/request'

/**
 * POST /api/admin/set-locale
 * Body: { locale: 'fr' | 'es' | 'en' }
 *
 * Pose le cookie `farmau_admin_locale` côté serveur. Admin-only.
 * Le client appelle ensuite `router.refresh()` pour relire les messages.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = (await request.json().catch(() => null)) as { locale?: string } | null
  const locale = body?.locale ?? ''
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return NextResponse.json({ error: 'invalid_locale' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true, locale })
  response.cookies.set({
    name: ADMIN_LOCALE_COOKIE,
    value: locale,
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365, // 1 an
  })
  return response
}
