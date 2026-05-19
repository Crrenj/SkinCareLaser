import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

/**
 * Middleware Next.js qui chaîne :
 *   - /admin/*           -> check session + admin (Supabase SSR)
 *   - / et /(fr|es|en)/* -> next-intl (routing locale)
 *   - autres             -> passthrough
 *
 * Pendant la migration i18n progressive, les pages publiques pas encore
 * sous `[locale]/` (ex: /catalogue, /cart, /contact, /a-propos) sont
 * laissées passer telles quelles. Elles seront déplacées au palier 2.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static / API / fichiers : passthrough (le matcher devrait déjà filtrer
  // mais on défense en profondeur)
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Admin : auth check existant
  if (pathname.startsWith('/admin')) {
    return adminAuthMiddleware(request)
  }

  // Intl : racine + routes localisées
  const isLocalePrefixed = /^\/(fr|es|en)(\/|$)/.test(pathname)
  if (pathname === '/' || isLocalePrefixed) {
    return intlMiddleware(request)
  }

  // Routes publiques pas encore migrées sous [locale] : passthrough
  return NextResponse.next()
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
