import { test, expect } from '@playwright/test'

/**
 * Chasse aux liens morts dans le footer. On charge la home, on récupère
 * tous les <a href> du <footer>, et on vérifie que chacun renvoie un statut
 * < 400 quand suivi. Évite la régression "lien obsolète" comme celle qu'on
 * a eue avec /besoins/nettoyage.
 *
 * On ne suit que les liens internes (commence par "/" ou même origin).
 * Les liens externes (whatsapp, mailto, tel) sont ignorés.
 */
test('Footer : aucun lien interne en 404', async ({ page, baseURL }) => {
  // Dev Turbopack compile chaque route en cold au 1er hit (~3-30s par route).
  // 10+ routes dans le footer → on bump à 240s pour sérialiser sans risquer
  // d'OOM le dev server (la version parallèle crashait Node).
  test.setTimeout(240_000)

  await page.goto('/fr/', { waitUntil: 'domcontentloaded' })
  await page.locator('footer').first().waitFor({ timeout: 30_000 })

  const hrefs = await page.locator('footer a[href]').evaluateAll((nodes) =>
    nodes
      .map((n) => (n as HTMLAnchorElement).getAttribute('href') ?? '')
      .filter((h) => h && !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('https://wa.me/'))
      .filter((h) => h.startsWith('/') || h.startsWith(window.location.origin)),
  )
  const unique = Array.from(new Set(hrefs))
  expect(unique.length).toBeGreaterThan(5)

  // Sérialisé pour éviter de saturer Turbopack en cold compile.
  const failures: { url: string; status: number }[] = []
  for (const href of unique) {
    const url = href.startsWith('/') ? `${baseURL}${href}` : href
    const response = await page.request.get(url, { failOnStatusCode: false })
    if (response.status() >= 400) failures.push({ url, status: response.status() })
  }
  expect(failures, `Liens en erreur:\n${failures.map((f) => `  ${f.status} ${f.url}`).join('\n')}`).toEqual([])
})
