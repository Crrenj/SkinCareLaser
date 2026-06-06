import { test, expect, type Page } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  type TestUser,
} from './_helpers/test-users'

/**
 * Smoke admin loggé — lecture seule sur prod. Crée un user temporaire promu
 * admin (admin_users + profiles.is_admin), supprimé en afterAll.
 *
 * Note Playwright : describe.serial ordonne les tests mais ne partage pas
 * le browserContext entre eux. On re-logge donc dans chaque test via un
 * beforeEach. C'est tolérable (~3s × N tests).
 */

let admin: TestUser

test.describe('Admin loggé — smoke lecture seule', () => {
  test.use({
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
  })

  test.beforeAll(async () => {
    admin = await createTestUser({ isAdmin: true })
  })

  test.afterAll(async () => {
    if (admin) await deleteTestUser(admin.id).catch(() => undefined)
  })

  async function loginAdmin(page: Page) {
    await page.addInitScript(() => {
      window.localStorage.setItem('farmau:cookies:consent', 'accepted')
    })
    await page.goto('/fr/login', { waitUntil: 'load' })
    await page.locator('#email').waitFor({ state: 'attached' })
    await page.locator('#email').fill(admin.email)
    await page.locator('#password').fill(admin.password)
    await Promise.all([
      page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 }),
      page.getByRole('button', { name: /se connecter/i }).click(),
    ])
  }

  test('Login admin → /admin (dashboard) + sidebar visible', async ({ page }) => {
    await loginAdmin(page)
    await expect(page).toHaveURL(/\/admin(\/|$)/)
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible({ timeout: 30_000 })
  })

  test('Sidebar liste tous les liens des sections admin', async ({ page }) => {
    await loginAdmin(page)
    const sidebar = page.locator('[data-testid="admin-sidebar"]')
    await expect(sidebar).toBeVisible({ timeout: 30_000 })

    const expectedHrefs = [
      '/admin/product',
      '/admin/marques',
      '/admin/tags',
      '/admin/stock',
      '/admin/reservations',
      '/admin/messages',
      '/admin/users',
      '/admin/newsletter',
      '/admin/settings',
    ]
    for (const href of expectedHrefs) {
      await expect(sidebar.locator(`a[href="${href}"]`)).toHaveCount(1)
    }
  })

  const adminPages = [
    '/admin/product',
    '/admin/marques',
    '/admin/tags',
    '/admin/stock',
    '/admin/reservations',
    '/admin/messages',
    '/admin/users',
    '/admin/newsletter',
    '/admin/settings',
  ] as const

  for (const path of adminPages) {
    test(`Page ${path} charge sans 500`, async ({ page }) => {
      // Dev cold-compile : login (~3s) + goto admin page (jusqu'à 30s sur la
      // 1ère visite Turbopack) + sidebar wait. 30s par défaut trop court.
      test.setTimeout(90_000)
      await loginAdmin(page)
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBeLessThan(500)
      await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible({ timeout: 30_000 })
    })
  }
})
