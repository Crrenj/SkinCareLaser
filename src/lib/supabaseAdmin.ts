import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { getServerEnv } from '@/lib/env'

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
// Clé service-role résolue via env.ts (accepte les 2 noms ; non-throwant →
// supabaseAdmin reste `null` si absente, comportement historique préservé).
const supabaseServiceKey = getServerEnv().serviceKey

export const supabaseAdmin: SupabaseClient<Database> | null =
  supabaseUrl && supabaseServiceKey
    ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null
