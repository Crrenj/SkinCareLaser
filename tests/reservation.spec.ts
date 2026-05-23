import { test, expect } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  type TestUser,
} from './_helpers/test-users'

/**
 * Parcours réservation E2E.
 *
 * Flow viable : add au panier en anonyme → login (useAuth merge le cart anon
 * vers user_id) → POST /api/cart/reserve → 200.
 *
 * NB : si on add APRÈS le login, /api/cart POST recrée un cart anon (la route
 * ne lit que le cookie cart_id, pas la session JWT) → cart orphelin →
 * /api/cart/reserve renvoie 400 cart_empty. Bug pré-existant, pas l'objet
 * du test ici.
 */
test.describe('Réservation E2E', () => {
  test.describe.configure({ mode: 'serial' })
  test.use({
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
  })

  let user: TestUser

  test.beforeEach(async ({ page }) => {
    user = await createTestUser({ withPhone: true })
    await page.addInitScript(() => {
      window.localStorage.setItem('farmau:cookies:consent', 'accepted')
    })
  })

  test.afterEach(async () => {
    if (user) await deleteTestUser(user.id).catch(() => undefined)
  })

  async function addFeaturedToCart(page: import('@playwright/test').Page) {
    const cartReady = page.waitForResponse(
      (r) => r.url().endsWith('/api/cart') && r.request().method() === 'GET',
      { timeout: 30_000 },
    )
    await page.goto('/fr/', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 60_000 })
    await cartReady

    const addRequest = page.waitForResponse(
      (r) => r.url().endsWith('/api/cart') && r.request().method() === 'POST',
      { timeout: 30_000 },
    )
    await page.locator('[data-testid="add-to-cart-button"]').first().click()
    const addResp = await addRequest
    expect(addResp.status()).toBe(200)
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1', { timeout: 10_000 })
  }

  async function loginAs(
    page: import('@playwright/test').Page,
    u: TestUser,
  ) {
    await page.goto('/fr/login', { waitUntil: 'load' })
    await page.locator('#email').waitFor({ state: 'attached' })
    await page.locator('#email').fill(u.email)
    await page.locator('#password').fill(u.password)
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60_000 }),
      page.getByRole('button', { name: /se connecter/i }).click(),
    ])
    // Attendre que useAuth ait migré le cart anon → user_id (le hook fire
    // sur SIGNED_IN puis refreshCart). On poll /api/cart jusqu'à items > 0.
    await expect
      .poll(
        async () => {
          const r = await page.request.get('/api/cart')
          if (!r.ok()) return -1
          const body = (await r.json()) as { totalItems?: number }
          return body.totalItems ?? 0
        },
        { timeout: 15_000, intervals: [500, 1000, 2000] },
      )
      .toBeGreaterThan(0)
  }

  test('Happy path : addToCart anon → login (merge) → reserve → 200 + /account/reservations', async ({
    page,
  }) => {
    await addFeaturedToCart(page)
    await loginAs(page, user)

    const reserveResp = await page.request.post('/api/cart/reserve')
    expect(reserveResp.status()).toBe(200)
    const body = await reserveResp.json()
    expect(body.success).toBe(true)
    expect(body.reservationId).toMatch(/^[0-9a-f-]{36}$/)

    await page.goto('/fr/account/reservations', { waitUntil: 'domcontentloaded' })
    // La page affiche la référence FAR-YYYYMMDD-XXXX (4 premiers hex en maj
    // après la date). On vérifie juste le segment XXXX, le préfixe `FAR-` et
    // la date dépendent de la création de la résa.
    const idHex4 = body.reservationId.replace(/-/g, '').slice(0, 4).toUpperCase()
    await expect(
      page.locator(`text=FAR-`).filter({ hasText: idHex4 }).first(),
    ).toBeVisible({ timeout: 30_000 })
  })

  test('409 si réservation active déjà en cours', async ({ page }) => {
    await addFeaturedToCart(page)
    await loginAs(page, user)

    const first = await page.request.post('/api/cart/reserve')
    expect(first.status()).toBe(200)

    // La résa a vidé le cart. On re-ajoute pour tenter une 2e résa.
    // (add en authentifié, donc nouveau cart anon orphelin — mais peu importe :
    // la RPC create_reservation vérifie d'abord "déjà active ?" avant le cart,
    // donc 409 attendu même si cart_empty arriverait après.)
    await addFeaturedToCart(page)

    const second = await page.request.post('/api/cart/reserve')
    expect(second.status()).toBe(409)
    const body = await second.json()
    expect(body.code).toBe('already_active')
  })
})
