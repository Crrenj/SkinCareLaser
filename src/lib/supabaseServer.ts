import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Client Supabase pour le serveur (SSR)
 * Utilise createServerClient pour les opérations côté serveur
 * 
 * ⚠️ À utiliser uniquement dans :
 * - Les Server Components
 * - Les API Routes
 * - Les fonctions getServerSideProps
 * 
 * Pour les Client Components, utilisez @/lib/supabaseClient
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignore les erreurs de cookies en lecture seule
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignore les erreurs de cookies en lecture seule
          }
        },
      },
    }
  )
} 