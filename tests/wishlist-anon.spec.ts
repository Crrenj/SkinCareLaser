import { test, expect } from '@playwright/test'

/**
 * Wishlist en mode anonyme : le hook useWishlist retourne `needAuth: true`,
 * et le bouton heart redirige vers /login?redirectedFrom=/favoris.
 */
test('Heart non connecté redirige vers /login', async ({ page }) => {
  test.setTimeout(90_000)

  await page.goto('/fr/', { waitUntil: 'domcontentloaded' })
  // Le 1er heart d'une ProductCard sur la home (section Bestsellers).
  const heart = page.locator('[data-testid="product-card"]').first().locator('button[aria-label]').first()
  await heart.waitFor({ state: 'visible', timeout: 30_000 })

  await Promise.all([
    page.waitForURL(/\/login(\?|$)/, { timeout: 30_000 }),
    heart.click(),
  ])

  const url = new URL(page.url())
  expect(url.searchParams.get('redirectedFrom')).toBe('/favoris')
})
