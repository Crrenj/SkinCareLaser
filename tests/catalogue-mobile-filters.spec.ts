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

  test('sheet lisible (≥ 50% écran) avec catégories visibles, non effondré', async ({ page }) => {
    await seedConsent(page)
    await page.goto('/fr/catalogue', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Filtres', exact: true }).click()
    await page.locator('dialog.farmau-sheet').waitFor({ state: 'visible' })

    const m = await page.evaluate(() => {
      const dlg = document.querySelector('dialog.farmau-sheet') as HTMLDialogElement
      const content = dlg.querySelector('.flex-1') as HTMLElement | null
      return {
        vh: window.innerHeight,
        dialogH: dlg.offsetHeight,
        contentH: content?.offsetHeight ?? 0,
        sectionCount: dlg.querySelectorAll('[data-section]').length,
      }
    })
    // ≥ moitié d'écran pour la lisibilité (demande explicite).
    expect(m.dialogH).toBeGreaterThanOrEqual(m.vh * 0.5)
    // La zone de filtres scrollable ne s'effondre PAS à 0 (régression catégories).
    expect(m.contentH).toBeGreaterThan(100)
    // Tri + Marques + au moins une catégorie de tags rendus.
    expect(m.sectionCount).toBeGreaterThanOrEqual(3)
    // Une catégorie de tags concrète est présente dans le DOM du sheet.
    await expect(
      page.locator('dialog.farmau-sheet [data-section="besoins"]'),
    ).toBeVisible()
  })

  test('dismiss (backdrop + swipe), scroll-lock du body, sélection optimiste', async ({ page }) => {
    await seedConsent(page)
    await page.goto('/fr/catalogue', { waitUntil: 'networkidle' })
    const sheet = page.locator('dialog.farmau-sheet')
    const openSheet = async () => {
      await page.getByRole('button', { name: 'Filtres', exact: true }).click()
      await expect(sheet).toBeVisible()
    }
    await openSheet()

    // Anti scroll-bleed : le body est figé tant que le sheet est ouvert.
    expect(await page.evaluate(() => getComputedStyle(document.body).position)).toBe('fixed')

    // Sélection optimiste : la case se coche sans attendre le retour serveur.
    const input = sheet.locator('[data-section="brands"] input[type="checkbox"]').first()
    await sheet.locator('[data-section="brands"] label').first().click({ noWaitAfter: true })
    await expect(input).toBeChecked({ timeout: 600 })

    // Swipe vers le bas sur le header → ferme (drag-to-dismiss).
    await page.evaluate(() => {
      const dlg = document.querySelector('dialog.farmau-sheet') as HTMLDialogElement
      const grab = dlg.querySelector('header')!.parentElement as HTMLElement
      const r = grab.getBoundingClientRect()
      const x = r.left + r.width / 2
      const y0 = r.top + 10
      const fire = (type: string, cy: number) => {
        const ev = new Event(type, { bubbles: true, cancelable: true })
        const pt = { clientX: x, clientY: cy, identifier: 1, target: grab }
        Object.defineProperty(ev, 'touches', { value: type === 'touchend' ? [] : [pt] })
        Object.defineProperty(ev, 'changedTouches', { value: [pt] })
        grab.dispatchEvent(ev)
      }
      fire('touchstart', y0)
      fire('touchmove', y0 + 70)
      fire('touchmove', y0 + 170) // dy = 170 > seuil 80
      fire('touchend', y0 + 170)
    })
    await expect(sheet).toBeHidden()
    // Body déverrouillé après fermeture.
    expect(await page.evaluate(() => getComputedStyle(document.body).position)).toBe('static')

    // Tap sur le backdrop (au-dessus de la feuille) → ferme.
    await openSheet()
    await page.mouse.click(196, 14)
    await expect(sheet).toBeHidden()
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
