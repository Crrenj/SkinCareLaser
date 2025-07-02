import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware corrigé pour l'authentification admin
 * Gère correctement la synchronisation des cookies
 */
export async function middleware(request: NextRequest) {
  // Créer une réponse mutable
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Créer le client Supabase avec gestion correcte des cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Définir le cookie dans la réponse
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          // Supprimer le cookie en définissant maxAge à 0
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  // Récupérer la session
  const { data: { session } } = await supabase.auth.getSession()

  // Protection des routes admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Pas de session = redirection vers login
    if (!session) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Vérifier si l'utilisateur est admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    // Si pas admin, rediriger avec erreur
    if (!profile?.is_admin) {
      const url = new URL('/login', request.url)
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }
  }

  // Retourner la réponse avec les cookies mis à jour
  return response
}

// Routes à protéger
export const config = {
  matcher: ['/admin/:path*']
} 