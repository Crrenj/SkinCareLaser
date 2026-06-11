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
  // Catalogue (et plus la home) : depuis la refonte home-moderna (2026-06),
  // la section Bestsellers de la home n'utilise plus ProductCard (grille
  // éditoriale <h3>) → plus AUCUN data-testid="product-card" sur /fr/.
  // Le catalogue les a, et tous les produits actifs ont du stock (l'ancienne
  // raison de passer par la home — 349 produits à stock 0 — n'existe plus).
  // On attend aussi le GET /api/cart : useCart.addToCart return silencieusement
  // si data?.cart n'est pas encore hydraté.
  const cartReady = page.waitForResponse(
    (r) => r.url().endsWith('/api/cart') && r.request().method() === 'GET',
    { timeout: 60_000 },
  )
  await page.goto('/fr/catalogue', { waitUntil: 'domcontentloaded' })
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

  test('Persistance du panier après refresh', async ({ page }) => {
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

    // Régression P0 : la quantité doit PERSISTER à 2 après reload. Le bug
    // historique (stepper envoyait une valeur absolue à add_to_cart, qui
    // incrémente) faisait monter la quantité serveur à 3 ; l'assertion
    // optimiste ci-dessus passait par timing avant que refreshCart() ne révèle
    // la divergence. On revalide donc l'état serveur après un reload.
    await page.reload()
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('2', { timeout: 15_000 })
  })

  test('Suppression d\'un item du panier', async ({ page }) => {
    await gotoCatalogueReady(page)
    await page.locator('[data-testid="add-to-cart-button"]').first().click()
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1', { timeout: 10_000 })

    await page.locator('[data-testid="cart-icon"]').click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    // Attendre que l'item soit rendu/hydraté dans le drawer avant le remove
    // (évite un clic dans le vide en run unifié cold-compile).
    await expect(
      page.locator('[data-testid="cart-drawer"] [data-testid="cart-item"]').first(),
    ).toBeVisible({ timeout: 10_000 })

    await page.locator('[data-testid="cart-drawer"] [data-testid="remove-item"]').first().click()

    // Signal direct : l'item disparaît du drawer, puis le badge tombe à 0.
    await expect(
      page.locator('[data-testid="cart-drawer"] [data-testid="cart-item"]'),
    ).toHaveCount(0, { timeout: 10_000 })
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveCount(0, { timeout: 10_000 })
  })
})
