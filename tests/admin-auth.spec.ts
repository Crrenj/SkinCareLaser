import { test, expect } from '@playwright/test'

/**
 * Vérifie que toutes les routes admin redirigent un visiteur non authentifié
 * vers /login avec le paramètre `redirectedFrom`. Ce sont des tests de
 * "auth guard" — ils n'ont pas besoin de credentials et tournent vite.
 *
 * Le check ne consomme pas la DB et est résilient aux changements de
 * contenu admin.
 */
test.describe('Admin auth guard', () => {
  test.use({
    navigationTimeout: 60_000,
  })

  const adminRoutes = [
    '/admin',
    '/admin/product',
    '/admin/marques',
    '/admin/tags',
    '/admin/stock',
    '/admin/messages',
    '/admin/annonce',
    '/admin/reservations',
    '/admin/users',
    '/admin/newsletter',
    '/admin/settings',
    '/admin/setup',
  ] as const

  for (const route of adminRoutes) {
    test(`${route} → redirige vers /login si non authentifié`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      // Le middleware redirige vers /login?redirectedFrom=<route>
      await expect(page).toHaveURL(/\/login(\?|$)/, { timeout: 30_000 })
      const url = new URL(page.url())
      expect(url.searchParams.get('redirectedFrom')).toBe(route)
    })
  }

  test('Aucun chrome admin rendu sur la page /login post-redirect', async ({ page }) => {
    await page.goto('/admin/product', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
    // La sidebar admin ne doit pas être présente sur /login
    await expect(page.locator('[data-testid="admin-sidebar"]')).toHaveCount(0)
    // Le formulaire de login doit être présent (h1 "Se connecter" en FR)
    await expect(page.getByRole('heading', { name: /se connecter/i })).toBeVisible({
      timeout: 30_000,
    })
  })
})
