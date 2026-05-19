import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la clé service-role qui bypass les RLS.
 *
 * ⚠️ NE JAMAIS importer ce fichier depuis du code client (use server only).
 *
 * Singleton instancié au boot du serveur ; retourne `null` si la clé est
 * absente afin que les routes API puissent répondre proprement plutôt que
 * de crasher au chargement du module.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null
