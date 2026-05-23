import { test, expect } from '@playwright/test'

/**
 * i18n FR/EN/ES : switcher de locale + hreflang.
 */
test.describe('i18n', () => {
  test.use({ navigationTimeout: 60_000 })

  test('Bascule FR → ES → EN sur catalogue', async ({ page }) => {
    await page.goto('/fr/catalogue', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')

    await page.goto('/es/catalogue', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')

    await page.goto('/en/catalogue', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('hreflang alternates présents sur la home', async ({ page }) => {
    await page.goto('/fr/', { waitUntil: 'domcontentloaded' })
    const fr = page.locator('link[hreflang="fr"]')
    const es = page.locator('link[hreflang="es"]')
    const en = page.locator('link[hreflang="en"]')
    const xDefault = page.locator('link[hreflang="x-default"]')
    await expect(fr).toHaveCount(1)
    await expect(es).toHaveCount(1)
    await expect(en).toHaveCount(1)
    await expect(xDefault).toHaveCount(1)
  })
})
