import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware DEBUG - avec logs détaillés
 */
export async function middleware(request: NextRequest) {
  console.log('\n=== MIDDLEWARE DEBUG ===')
  console.log('📍 Path:', request.nextUrl.pathname)
  console.log('🍪 Cookies:', request.cookies.getAll().map(c => c.name))

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          console.log('🔍 Getting cookies:', cookies.length, 'cookies')
          return cookies
        },
        setAll(cookiesToSet) {
          console.log('📝 Setting cookies:', cookiesToSet.length, 'cookies')
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Récupérer la session
  console.log('🔐 Récupération de la session...')
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('❌ Erreur session:', error)
  }
  
  console.log('👤 Session:', session ? `User ${session.user.email}` : 'Pas de session')

  // Si l'utilisateur essaie d'accéder aux routes admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('🛡️ Route admin détectée')
    
    // Pas de session = redirection vers login
    if (!session) {
      console.log('❌ Pas de session - Redirection vers login')
      const url = new URL('/login', request.url)
      url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    console.log('✅ Session trouvée pour:', session.user.email)
    console.log('📋 User ID:', session.user.id)

    // Vérifier si l'utilisateur est admin
    const isAdminFromMeta = session.user.app_metadata?.role === 'admin'
    console.log('🏷️ Admin depuis app_metadata:', isAdminFromMeta)
    
    // Si pas dans app_metadata, vérifier dans la table profiles
    if (!isAdminFromMeta) {
      console.log('🔍 Vérification dans la table profiles...')
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('❌ Erreur profil:', profileError)
      }

      const isAdminFromProfile = profile?.is_admin === true
      console.log('👤 Admin depuis profiles:', isAdminFromProfile)

      // Si pas admin, rediriger vers login
      if (!isAdminFromProfile) {
        console.log('🚫 Pas admin - Redirection vers login')
        const url = new URL('/login', request.url)
        url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
        url.searchParams.set('error', 'unauthorized')
        return NextResponse.redirect(url)
      }
    }
    
    console.log('✅ Utilisateur admin - Accès autorisé')
  }

  console.log('=== FIN MIDDLEWARE ===\n')
  return supabaseResponse
}

// Routes à protéger
export const config = {
  matcher: ['/admin/:path*']
} 