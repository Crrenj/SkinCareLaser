import { cleanupStaleTestUsers } from './test-users'

/**
 * Playwright globalTeardown — re-purge après la suite pour ne laisser aucun
 * résidu `@farmau.test` dans le projet Supabase (la suite écrit en prod sur le
 * plan actuel). Les tests bien élevés nettoient déjà leur user en afterEach ;
 * ceci est le filet de sécurité. [C-19]
 */
export default async function globalTeardown(): Promise<void> {
  const deleted = await cleanupStaleTestUsers()
  if (deleted > 0) {
     
    console.log(`[e2e teardown] purgé ${deleted} user(s) de test résiduel(s)`)
  }
}
