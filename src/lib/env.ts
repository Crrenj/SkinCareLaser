import { z } from 'zod'

/**
 * Validation centralisée des variables d'environnement (Zod).
 *
 * - `getServerEnv()` : secrets serveur. **Non-throwante** (safeParse) pour
 *   préserver la tolérance de `supabaseAdmin` (reste `null` si la clé manque)
 *   et ne JAMAIS casser `next build` quand les secrets ne sont pas fournis
 *   (ex. CI). Résout le double nom de la clé service-role.
 * - `getPublicEnv()` : vars `NEXT_PUBLIC_*`. **Throwante** avec message clair
 *   (utilisable côté serveur ; ces vars sont obligatoires). Côté navigateur,
 *   `supabaseClient.ts` fait un garde léger sans Zod (pas de bloat de bundle).
 *
 * Les deux sont *lazy + cache* : validées au 1er appel, jamais au module-load
 * (piège documenté : valider à l'import casserait le build sans secrets).
 */

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n')
}

// --- Serveur -----------------------------------------------------------------

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
  // Format vérifié séparément (non bloquant) pour ne pas annuler la résolution
  // de la clé service-role si RESEND_API_KEY est mal formée.
  RESEND_API_KEY: z.string().optional(),
})

export type ServerEnv = {
  /** Clé service-role résolue (SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_SERVICE_KEY). */
  serviceKey: string | undefined
  resendApiKey: string | undefined
  ok: boolean
  errors: string | null
}

let serverCache: ServerEnv | null = null

export function getServerEnv(): ServerEnv {
  if (serverCache) return serverCache
  const parsed = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  })
  serverCache = parsed.success
    ? {
        serviceKey:
          parsed.data.SUPABASE_SERVICE_ROLE_KEY ?? parsed.data.SUPABASE_SERVICE_KEY,
        resendApiKey: parsed.data.RESEND_API_KEY,
        ok: true,
        errors: null,
      }
    : { serviceKey: undefined, resendApiKey: undefined, ok: false, errors: formatIssues(parsed.error) }
  return serverCache
}

// --- Public ------------------------------------------------------------------

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

type PublicEnv = z.infer<typeof publicSchema>
let publicCache: PublicEnv | null = null

export function getPublicEnv(): PublicEnv {
  if (publicCache) return publicCache
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
  if (!parsed.success) {
    throw new Error(
      `[env] Variables publiques invalides/manquantes :\n${formatIssues(parsed.error)}`,
    )
  }
  publicCache = parsed.data
  return publicCache
}
