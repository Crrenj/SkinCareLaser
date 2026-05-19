import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

/**
 * Middleware Next.js qui chaîne :
 *   - /admin/*       -> check session + admin (Supabase SSR)
 *   - /auth/callback -> passthrough (OAuth Supabase, URL système non-localisée)
 *   - tout le reste  -> next-intl (routing locale)
 *
 * Toutes les pages publiques sont sous `[locale]/`. Un hit sur un path
 * non-préfixé (ex: `/catalogue`) est redirigé vers `/<locale>/catalogue`
 * par next-intl, avec la locale détectée depuis Accept-Language.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static / API / fichiers : passthrough
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next()
  }

  // OAuth Supabase callback : URL système, ne pas localiser
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // Admin : auth check existant (jamais localisé)
  if (pathname.startsWith('/admin')) {
    return adminAuthMiddleware(request)
  }

  // Tout le reste : intl gère (préfixe locale, redirige si manquant)
  return intlMiddleware(request)
}

async function adminAuthMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 0,
          })
        },
      },
    },
  )

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) console.error('Middleware session error:', error)

    if (!session) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (!profile?.is_admin) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(redirectUrl)
    }
  } catch (e) {
    console.error('Middleware error:', e)
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('error', 'middleware_error')
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  // Tout sauf api, _next, et fichiers avec extension
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
