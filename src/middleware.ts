import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * ⚠️ ATTENTION - MIDDLEWARE D'AUTHENTIFICATION CRITIQUE ⚠️
 * 
 * Ce middleware protège les routes admin et gère l'authentification.
 * 
 * 🚨 NE PAS MODIFIER SANS AUTORISATION 🚨
 * 
 * Problèmes résolus :
 * - Synchronisation des cookies Supabase
 * - Redirections infinies
 * - Sessions perdues entre les pages
 * - Gestion des erreurs d'authentification
 * 
 * Fonctionnalités :
 * - Protection des routes /admin/*
 * - Vérification du statut admin
 * - Gestion des cookies sécurisés
 * - Redirections appropriées
 * 
 * Si vous devez modifier ce code :
 * 1. Demandez l'autorisation
 * 2. Testez toutes les routes protégées
 * 3. Vérifiez les redirections
 * 4. Testez avec différents types d'utilisateurs
 */

/**
 * Middleware d'authentification corrigé
 * Gère correctement la synchronisation des cookies Supabase
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes à exclure du middleware
  const publicRoutes = ['/login', '/signup', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Routes API et assets à ignorer
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next()
  }
  
  // Si c'est une route publique, laisser passer
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Si ce n'est pas une route admin, laisser passer
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  console.log('🔒 Protection route admin:', pathname)

  // Créer une réponse
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Créer le client Supabase avec la bonne gestion des cookies
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
            sameSite: 'lax' as const,
            secure: process.env.NODE_ENV === 'production'
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            sameSite: 'lax' as const,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 0
          })
        },
      },
    }
  )

  try {
    // Récupérer la session actuelle
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Erreur session:', error)
    }

    // Pas de session = redirection vers login
    if (!session) {
      console.log('❌ Pas de session, redirection vers login')
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    console.log('✅ Session trouvée pour:', session.user.email)

    // Vérifier si l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('❌ Erreur profil:', profileError)
    }

    // Si pas admin, rediriger avec erreur
    if (!profile?.is_admin) {
      console.log('❌ Utilisateur non admin')
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(redirectUrl)
    }

    console.log('✅ Accès admin autorisé')
    
  } catch (error) {
    console.error('❌ Erreur middleware:', error)
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('error', 'middleware_error')
    return NextResponse.redirect(redirectUrl)
  }

  // Retourner la réponse avec les cookies mis à jour
  return response
}

// Routes à protéger
export const config = {
  matcher: ['/admin/:path*']
} 