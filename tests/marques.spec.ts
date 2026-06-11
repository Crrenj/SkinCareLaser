import { test, expect } from '@playwright/test'

/**
 * Index /marques + landing /marques/[slug]. Lit les 13 brands depuis Supabase.
 */
test.describe('Pages marques', () => {
  test.use({ navigationTimeout: 60_000 })

  test('/fr/marques liste les marques actives', async ({ page }) => {
    await page.goto('/fr/marques', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 })
    // Au moins 5 liens vers /marques/<slug> — scopés au <main> : depuis la
    // NavBar v2 (méga-menus, 2026-06), le DOM contient AVANT la grille des
    // liens marques CACHÉS dans le menu catálogo → un .first() global
    // tombait sur un lien hidden.
    const brandLinks = page.locator('main a[href*="/fr/marques/"]')
    await expect(brandLinks.first()).toBeVisible({ timeout: 30_000 })
    const count = await brandLinks.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test('Click sur une marque ouvre sa landing', async ({ page }) => {
    await page.goto('/fr/marques', { waitUntil: 'domcontentloaded' })
    const firstBrand = page.locator('main a[href*="/fr/marques/"]').first()
    const href = await firstBrand.getAttribute('href')
    expect(href).toBeTruthy()

    await Promise.all([
      page.waitForURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 60_000 }),
      firstBrand.click(),
    ])
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 })
  })
})
