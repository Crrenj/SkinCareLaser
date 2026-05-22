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
    // getUser() fait un appel API à Supabase pour valider le JWT cryptographi-
    // quement, contrairement à getSession() qui se contente de lire le cookie.
    // Coût : ~50-200ms supplémentaires par nav admin (acceptable — l'admin est
    // interne) en échange d'une vraie validation côté serveur d'auth (cf. audit
    // security #11).
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error && error.name !== 'AuthSessionMissingError') {
      console.error('Middleware getUser error:', error.message)
    }

    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Source de vérité admin : RPC is_user_admin (SECURITY DEFINER, lit
    // admin_users qui n'est pas exposée en SELECT direct au rôle anon). C'est
    // la même fonction utilisée par les policies RLS, donc on aligne le
    // middleware avec le reste du système (cf. audit security #8 — la
    // divergence historique middleware vs requireAdmin/RPC est fermée).
    const { data: isAdmin } = await supabase.rpc('is_user_admin', {
      check_user_id: user.id,
    })

    if (!isAdmin) {
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
