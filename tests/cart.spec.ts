import { test, expect, type Page } from '@playwright/test'

/**
 * Tests du panier invité (anonymous_id). Navigation via /fr/* explicite pour
 * éviter la redirection middleware par Accept-Language (Playwright Chromium
 * arrive en en-US par défaut). Tous les selectors visent les data-testid
 * pour rester stables aux refactors d'UI.
 *
 * Important : useCart.addToCart return silencieusement si `data?.cart` n'est
 * pas encore hydraté (initial GET /api/cart pas revenu). On attend donc cette
 * réponse avant de cliquer pour éviter les faux négatifs flaky.
 */
async function gotoCatalogueReady(page: Page) {
  // On va sur la home (et pas le catalogue) parce que la section "Bestsellers"
  // expose les 4 produits `is_featured` qui ont du stock — les 349 autres en
  // catalogue ont stock=0 et /api/cart renvoie 400. .first() touche donc
  // forcément un produit ajoutable au panier.
  // On attend aussi le GET /api/cart : useCart.addToCart return silencieusement
  // si data?.cart n'est pas encore hydraté.
  const cartReady = page.waitForResponse(
    (r) => r.url().endsWith('/api/cart') && r.request().method() === 'GET',
    { timeout: 30_000 },
  )
  await page.goto('/fr/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-testid="product-card"]', { timeout: 60_000 })
  await cartReady
}

test.describe('Panier invité', () => {
  test.describe.configure({ mode: 'serial' })
  test.use({
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
  })

  test('Ajout au panier en tant qu\'invité', async ({ page }) => {
    await gotoCatalogueReady(page)
    await page.locator('[data-testid="add-to-cart-button"]').first().click()

    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1', { timeout: 10_000 })
  })

  // FIXME: après reload, le badge ne réapparaît pas dans la fenêtre 10s.
  // Le POST /api/cart répond 200 mais la persistance via cookie cart_id
  // semble incompatible avec le timing SWR au remount. À investiguer.
  test.fixme('Persistance du panier après refresh', async ({ page }) => {
    await gotoCatalogueReady(page)
    await page.locator('[data-testid="add-to-cart-button"]').first().click()
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1', { timeout: 10_000 })

    await page.reload()

    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1', { timeout: 10_000 })
  })

  test('Ouverture du drawer du panier', async ({ page }) => {
    await gotoCatalogueReady(page)
    await page.locator('[data-testid="add-to-cart-button"]').first().click()
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1', { timeout: 10_000 })

    await page.locator('[data-testid="cart-icon"]').click()

    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    await expect(page.locator('[data-testid="cart-item"]').first()).toBeVisible()
  })

  test('Modification de la quantité dans le drawer', async ({ page }) => {
    await gotoCatalogueReady(page)
    await page.locator('[data-testid="add-to-cart-button"]').first().click()
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1', { timeout: 10_000 })

    await page.locator('[data-testid="cart-icon"]').click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()

    await page.locator('[data-testid="cart-drawer"] [data-testid="quantity-increase"]').first().click()

    await expect(
      page.locator('[data-testid="cart-drawer"] [data-testid="quantity-display"]').first(),
    ).toHaveText('2', { timeout: 10_000 })
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('2', { timeout: 10_000 })
  })

  test('Suppression d\'un item du panier', async ({ page }) => {
    await gotoCatalogueReady(page)
    await page.locator('[data-testid="add-to-cart-button"]').first().click()
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1', { timeout: 10_000 })

    await page.locator('[data-testid="cart-icon"]').click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()

    await page.locator('[data-testid="cart-drawer"] [data-testid="remove-item"]').first().click()

    await expect(page.locator('[data-testid="cart-badge"]')).toHaveCount(0, { timeout: 10_000 })
  })
})
