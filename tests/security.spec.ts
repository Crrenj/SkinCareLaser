import { test, expect } from '@playwright/test'
import { createTestUser, deleteTestUser, type TestUser } from './_helpers/test-users'

/**
 * Spécs sécurité (intégration). Lecture/écriture minimale sur prod : crée un
 * user temporaire @farmau.test, supprimé en afterAll (+ filet globalTeardown).
 *
 * Couverture :
 *  - Open-redirect bloqué au login (`?next=//evil.com` → reste interne). [C-08]
 *
 * NB : le mass-assignment produit (C-09) et le cap panier (C-13/C-28) sont
 * couverts au niveau validation par `src/__tests__/schemas.test.ts` (unitaire,
 * vérifiable sans serveur) ; l'open-redirect logique l'est par
 * `src/__tests__/safeRedirect.test.ts`. Ici on vérifie le CÂBLAGE réel.
 */

let user: TestUser

test.describe('Sécurité — câblage', () => {
  test.use({ navigationTimeout: 60_000, actionTimeout: 30_000 })

  test.beforeAll(async () => {
    user = await createTestUser({ withPhone: true })
  })

  test.afterAll(async () => {
    if (user) await deleteTestUser(user.id).catch(() => undefined)
  })

  test('login avec ?next=//evil.com ne redirige pas hors-site', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('farmau:cookies:consent', 'accepted')
    })
    await page.goto('/fr/login?next=//evil.com', { waitUntil: 'load' })
    await page.locator('#email').waitFor({ state: 'attached' })
    await page.locator('#email').fill(user.email)
    await page.locator('#password').fill(user.password)
    await page.getByRole('button', { name: /se connecter/i }).click()

    // La cible externe doit être rejetée par safeRedirectPath → redirection interne.
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 30_000 })
    const expectedHost = new URL(baseURL ?? 'http://localhost:3000').host
    expect(new URL(page.url()).host).toBe(expectedHost)
    expect(page.url()).not.toContain('evil.com')
  })
})
