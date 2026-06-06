import { cleanupStaleTestUsers } from './test-users'

/**
 * Playwright globalSetup — purge proactive des users de test périmés
 * (`playwright+*@farmau.test` plus vieux qu'1h) avant la suite, au cas où un
 * run précédent aurait crashé sans teardown. L'import de `test-users` déclenche
 * le garde-fou ALLOW_E2E (refus si non posé). [C-19]
 */
export default async function globalSetup(): Promise<void> {
  const deleted = await cleanupStaleTestUsers()
  if (deleted > 0) {
     
    console.log(`[e2e setup] purgé ${deleted} user(s) de test périmé(s)`)
  }
}
