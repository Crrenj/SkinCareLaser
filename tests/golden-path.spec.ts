import { test, expect } from '@playwright/test'

// Smoke tests : si ces 4 passent, le site n'est pas en feu.
// Volontairement limités au golden path (lecture catalogue + form contact).
// Lancer rapidement : `npm run test:smoke`
//
// Note : le dev server Turbopack compile chaque route à froid au premier
// hit (10-30s par route, surtout /catalogue qui fetch 500 produits SSR).
// On serialise (workers=1 dans le script npm) + on bump les timeouts pour
// que ces tests soient fiables sur un poste dev qui démarre tout à zéro.
test.describe('Golden path', () => {
  test.describe.configure({ mode: 'serial' })
  test.use({
    navigationTimeout: 90_000,
    actionTimeout: 30_000,
  })

  test('1. Page d\'accueil charge', async ({ page }) => {
    // /fr/ explicite — le middleware redirige / vers la locale du navigateur
    // (Playwright Chromium par défaut = en), ce qui invaliderait l'assert lang=fr.
    await page.goto('/fr/', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle(/FARMAU/i)
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    // Titre de la section bestsellers — « Les plus recherchés » depuis la
    // refonte home-moderna (2026-06 ; l'ancien titre était « Best-sellers »).
    await expect(
      page.getByRole('heading', { name: /les plus recherchés/i }),
    ).toBeVisible({ timeout: 30_000 })
  })

  test('2. Catalogue affiche des produits', async ({ page }) => {
    await page.goto('/fr/catalogue', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-testid="product-card"]', {
      timeout: 60_000,
    })
    const count = await page.locator('[data-testid="product-card"]').count()
    expect(count).toBeGreaterThan(0)
  })

  test('3. Clic sur un produit ouvre sa fiche', async ({ page }) => {
    await page.goto('/fr/catalogue', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-testid="product-card"]', {
      timeout: 60_000,
    })

    const firstCard = page.locator('[data-testid="product-card"]').first()
    const productName = (await firstCard.locator('h3').innerText()).trim()
    // ProductCard est en "stretched link" : un <a> absolute inset-0 z-10
    // recouvre toute la carte. Cliquer sur ce lien (par aria-label) est plus
    // fiable que viser un descendant qui peut être sous d'autres z-index.
    const stretchedLink = firstCard.getByRole('link', { name: productName }).first()

    await Promise.all([
      page.waitForURL(/\/product\/[a-z0-9][a-z0-9-]*/i, { timeout: 60_000 }),
      stretchedLink.click(),
    ])

    await expect(
      page.getByRole('heading', { name: productName }).first(),
    ).toBeVisible({ timeout: 30_000 })
  })

  test('4. Form contact se soumet (API mockée)', async ({ page }) => {
    // Intercept /api/contact : évite de polluer la DB + bypass rate limit
    await page.route('**/api/contact', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          messageId: 'test-golden-path',
          message: 'OK',
        }),
      }),
    )

    await page.goto('/fr/contact', { waitUntil: 'domcontentloaded' })
    await page.getByLabel(/adresse email/i).fill('test+golden@example.com')
    await page.getByLabel(/sujet/i).fill('Smoke test')
    await page
      .getByLabel(/message/i)
      .fill('Test automatisé golden path — à ignorer.')
    await page.getByRole('button', { name: /envoyer le message/i }).click()

    await expect(
      page.getByText(/votre message a été envoyé avec succès/i),
    ).toBeVisible({ timeout: 30_000 })
  })
})
