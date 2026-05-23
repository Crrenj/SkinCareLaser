import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

// Charge .env.local (Playwright tests tournent côté Node, hors Next).
loadEnv({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    'tests/_helpers/test-users: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY requis',
  )
}

const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export type TestUser = {
  id: string
  email: string
  password: string
}

/**
 * Crée un user de test via service role (bypass email confirm + restrictions
 * domaine). Met aussi à jour profiles.phone pour permettre la réservation.
 *
 * Convention de naming : `playwright+<ts>-<rand>@farmau.test` pour pouvoir
 * cleanup à la volée si un test crashe sans afterEach.
 */
export async function createTestUser(opts?: {
  withPhone?: boolean
  isAdmin?: boolean
}): Promise<TestUser> {
  const { withPhone = true, isAdmin = false } = opts ?? {}
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  const email = `playwright+${ts}-${rand}@farmau.test`
  const password = `Pw-${rand}-${ts}`

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) throw error ?? new Error('createUser returned no user')

  if (withPhone) {
    const { error: profileError } = await admin
      .from('profiles')
      .update({ phone: '+18091234567', display_name: 'Playwright Test' })
      .eq('id', data.user.id)
    if (profileError) throw profileError
  }

  if (isAdmin) {
    // admin_users = source de vérité RLS (utilisée par middleware via RPC
    // is_user_admin). profiles.is_admin = vestige legacy lu par /login pour
    // décider du redirect post-login vers /admin/product vs /. Les deux
    // doivent être set pour que le flow complet (login + middleware) marche.
    const { error: adminError } = await admin
      .from('admin_users')
      .insert({ user_id: data.user.id })
    if (adminError) throw adminError
    const { error: legacyError } = await admin
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', data.user.id)
    if (legacyError) throw legacyError
  }

  return { id: data.user.id, email, password }
}

export async function deleteTestUser(userId: string): Promise<void> {
  // RLS sur admin_users / autres tables : nettoyer côté service role suffit.
  await admin.from('admin_users').delete().eq('user_id', userId)
  // auth.users delete cascade sur profiles / carts / reservations grâce aux FK ON DELETE CASCADE.
  await admin.auth.admin.deleteUser(userId)
}

/**
 * Cleanup proactif : supprime tous les users playwright+*@farmau.test
 * dont l'email est plus vieux qu'1h. Utile en bootstrap de session si un
 * test précédent a crashé.
 */
export async function cleanupStaleTestUsers(): Promise<number> {
  let deleted = 0
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    })
    if (error) throw error
    if (!data.users.length) break
    const stale = data.users.filter((u) => {
      if (!u.email?.startsWith('playwright+')) return false
      if (!u.email.endsWith('@farmau.test')) return false
      const ageMs = Date.now() - new Date(u.created_at).getTime()
      return ageMs > 60 * 60 * 1000 // > 1h
    })
    for (const u of stale) {
      await deleteTestUser(u.id)
      deleted++
    }
    if (data.users.length < 1000) break
    page++
  }
  return deleted
}

export { admin as supabaseAdmin }
