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

  // Retry click→navigation : en run unifié (cold-compile Turbopack) le clic
  // peut précéder l'hydratation React du handler → aucun effet. toPass réessaie
  // le clic jusqu'à ce que la navigation vers /login se produise.
  await expect(async () => {
    if (!/\/login(\?|$)/.test(page.url())) {
      await heart.click({ timeout: 5_000 })
      await page.waitForURL(/\/login(\?|$)/, { timeout: 10_000 })
    }
  }).toPass({ timeout: 60_000 })

  const url = new URL(page.url())
  expect(url.searchParams.get('redirectedFrom')).toBe('/favoris')
})
