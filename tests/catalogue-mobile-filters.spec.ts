import { test, expect, type Page } from '@playwright/test'

/**
 * Régression : sur mobile, la pilule « Filtres » du catalogue doit être
 * réellement atteignable et ouvrir le bottom-sheet. Trois bugs cumulés la
 * rendaient inerte (cf. fix) :
 *   1. la barre d'URL basse de Safari iOS recouvrait son bas (env safe-area ne
 *      la couvre pas) → lift via `--browser-bottom-inset` (useBrowserBottomInset) ;
 *   2. auto-hide au scroll vers le bas → la pilule disparaissait en navigant ;
 *   3. le bandeau cookies pleine largeur (z-60) interceptait le tap → la pilule
 *      se masque tant qu'il est ouvert.
 *
 * La pilule est `lg:hidden`. On FORCE un viewport mobile pour que le spec tourne
 * sur TOUS les moteurs (Blink/chromium, Gecko/firefox, WebKit) + les profils
 * d'appareils (Mobile Chrome, Mobile Safari) → vérification cross-browser réelle.
 */
test.describe('catalogue — pilule de filtres mobile', () => {
  test.use({ viewport: { width: 393, height: 812 } })

  const topmostAtPillCenter = (page: Page) =>
    page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === 'Filtres',
      ) as HTMLButtonElement | undefined
      if (!btn) return false
      const r = btn.getBoundingClientRect()
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return !!el && (el === btn || btn.contains(el))
    })

  // Consentement cookies pré-acquis → pas de bandeau (déterministe, pas de race).
  const seedConsent = (page: Page) =>
    page.addInitScript(() => {
      try { window.localStorage.setItem('farmau:cookies:consent', 'accepted') } catch {}
    })

  test('atteignable au centre et ouvre le sheet', async ({ page }) => {
    await seedConsent(page)
    await page.goto('/fr/catalogue', { waitUntil: 'networkidle' })

    const pill = page.getByRole('button', { name: 'Filtres', exact: true })
    await expect(pill).toBeVisible()
    // Topmost à son centre = aucun élément flottant n'intercepte le tap.
    expect(await topmostAtPillCenter(page)).toBe(true)

    await pill.click()
    await expect(page.locator('dialog.farmau-sheet')).toBeVisible()
    await expect(page.getByRole('button', { name: /appliquer/i })).toBeVisible()
  })

  test('ne se cache plus au défilement vers le bas', async ({ page }) => {
    await seedConsent(page)
    await page.goto('/fr/catalogue', { waitUntil: 'networkidle' })

    await page.evaluate(() => window.scrollTo(0, 1600))
    await page.waitForTimeout(300)

    // Plus d'auto-hide : la pilule reste visible ET non interceptée après scroll.
    await expect(page.getByRole('button', { name: 'Filtres', exact: true })).toBeVisible()
    expect(await topmostAtPillCenter(page)).toBe(true)
  })

  test('reste masquée tant que le bandeau cookies couvre le bas', async ({ page }) => {
    await page.goto('/fr/catalogue', { waitUntil: 'networkidle' })
    // Le bandeau monte côté client après hydratation : on l'attend explicitement.
    await page.locator('#cookie-banner-title').waitFor({ state: 'visible' })

    // Bandeau pleine largeur ouvert → pilule masquée (sinon il intercepte le tap).
    await expect(page.locator('html')).toHaveAttribute('data-cookie-banner-open', '')
    await expect(page.getByRole('button', { name: 'Filtres', exact: true })).toBeHidden()

    // Après consentement, elle réapparaît et fonctionne.
    await page.getByRole('button', { name: "J'ai compris" }).click()
    await expect(page.locator('#cookie-banner-title')).toBeHidden()

    const pill = page.getByRole('button', { name: 'Filtres', exact: true })
    await expect(pill).toBeVisible()
    await pill.click()
    await expect(page.locator('dialog.farmau-sheet')).toBeVisible()
  })
})
