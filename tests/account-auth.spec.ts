import { test, expect } from '@playwright/test'

/**
 * Vérifie que les pages user authentifiées (`/account/*` + `/favoris`)
 * redirigent vers `/login` si non connecté. Comme admin-auth, pas besoin
 * de credentials.
 *
 * Toutes ces routes sont préfixées par la locale (next-intl), donc on
 * teste sur la locale par défaut `/fr/` et on s'attend à une redirection
 * vers `/fr/login`.
 */
test.describe('Account auth guard', () => {
  test.use({
    navigationTimeout: 60_000,
  })

  const accountRoutes = [
    '/fr/account/profile',
    '/fr/account/reservations',
    '/fr/account/security',
    '/fr/account/preferences',
    '/fr/favoris',
  ] as const

  for (const route of accountRoutes) {
    test(`${route} → redirige vers /fr/login si non authentifié`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      // Soit /fr/login (account routes), soit /fr/login?redirectedFrom=...
      // pour /favoris (qui passe par le middleware client-side).
      await expect(page).toHaveURL(/\/fr\/login/, { timeout: 30_000 })
    })
  }

  test('/es/account/profile redirige aussi (auth multi-locale)', async ({ page }) => {
    await page.goto('/es/account/profile', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/(es|fr)\/login/, { timeout: 30_000 })
  })
})
