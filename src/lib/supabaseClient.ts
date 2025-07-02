import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Supabase pour le navigateur
 * Utilise createBrowserClient pour une meilleure gestion des cookies avec Next.js
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
