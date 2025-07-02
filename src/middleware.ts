import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware TEMPORAIRE - Protection désactivée pour debug
 */
export async function middleware(request: NextRequest) {
  console.log('🔍 Middleware appelé pour:', request.nextUrl.pathname)
  
  // TEMPORAIRE : Désactiver la protection pour tester
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('⚠️  ATTENTION : Protection admin désactivée temporairement pour debug')
    console.log('✅ Autorisation de passage vers:', request.nextUrl.pathname)
  }
  
  // Laisser passer toutes les requêtes
  return NextResponse.next({
    request,
  })
}

// Routes à protéger (mais temporairement désactivé)
export const config = {
  matcher: ['/admin/:path*']
} 