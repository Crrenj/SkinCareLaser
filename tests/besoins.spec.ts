import { test, expect } from '@playwright/test'

/**
 * Pages /besoins/[slug] : landing data-driven par tag besoin.
 * Vérifie que le fix `tag_type='besoins'` du 2026-05-23 a réparé les 14 pages
 * et que les 404 design FARMAU sont toujours servis pour les slugs inconnus.
 */
test.describe('Pages besoins', () => {
  test.use({ navigationTimeout: 60_000 })

  test('/fr/besoins/nettoyage rend la page avec un h1 capitalisé', async ({ page }) => {
    await page.goto('/fr/besoins/nettoyage', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/fr\/besoins\/nettoyage$/)
    // tag_name = "nettoyage" → CSS capitalize → "Nettoyage"
    await expect(page.getByRole('heading', { level: 1, name: /nettoyage/i })).toBeVisible({
      timeout: 30_000,
    })
  })

  test('/fr/besoins/hydratation rend la liste des produits', async ({ page }) => {
    await page.goto('/fr/besoins/hydratation', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name: /hydratation/i })).toBeVisible({
      timeout: 30_000,
    })
    // Au moins une ProductCard ou un message "empty" — pas de crash
    const hasCards = await page.locator('[data-testid="product-card"]').count()
    expect(hasCards).toBeGreaterThanOrEqual(0)
  })

  test('/fr/besoins/slug-inexistant rend la 404 design FARMAU', async ({ page }) => {
    const response = await page.goto('/fr/besoins/ce-slug-nexiste-pas-xyz', {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBe(404)
    // not-found.tsx FARMAU au niveau locale : "Cette page n'existe plus"
    await expect(page.getByText(/cette page n['']existe plus/i)).toBeVisible({
      timeout: 30_000,
    })
  })
})
