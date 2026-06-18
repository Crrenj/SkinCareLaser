import { test, expect, type Page } from '@playwright/test'
import { createTestUser, deleteTestUser, supabaseAdmin, type TestUser } from './_helpers/test-users'

/**
 * E2E des 2 features 2026-06-18 : reçu (comprobante de retiro) + remise employé.
 *
 * SÛRETÉ PROD (une seule base = prod) :
 *  - admin temporaire (@farmau.test) supprimé en afterAll (cascade les résas liées) ;
 *  - lignes de vente LIBRES (product_id null) → aucun stock produit réel touché ;
 *  - ventes liées à user_id = l'admin de test → cascade-delete au cleanup ;
 *  - employee_discount_pct remis à 0 en afterAll.
 * Gardé par ALLOW_E2E=1 (helper test-users).
 */

let admin: TestUser
const ORIGIN = 'http://localhost:3000'

test.describe.serial('Reçu + remise employé', () => {
  test.use({ navigationTimeout: 60_000, actionTimeout: 30_000 })

  test.beforeAll(async () => {
    admin = await createTestUser({ isAdmin: true })
  })

  test.afterAll(async () => {
    await supabaseAdmin.from('shop_settings').update({ employee_discount_pct: 0 }).eq('id', 1)
    if (admin) await deleteTestUser(admin.id).catch(() => undefined)
  })

  async function loginAdmin(page: Page) {
    await page.addInitScript(() => {
      window.localStorage.setItem('farmau:cookies:consent', 'accepted')
    })
    await page.goto('/fr/login', { waitUntil: 'load' })
    await page.locator('#email').waitFor({ state: 'attached' })
    await page.locator('#email').fill(admin.email)
    await page.locator('#password').fill(admin.password)
    await Promise.all([
      page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 }),
      page.getByRole('button', { name: /se connecter/i }).click(),
    ])
  }

  test('réglage 15 % → réaffiché dans le champ (régression numeric→string) + barre admin', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await loginAdmin(page)

    const patch = await page.request.patch('/api/admin/settings', {
      headers: { Origin: ORIGIN },
      data: { employee_discount_pct: 15 },
    })
    expect(patch.ok()).toBeTruthy()

    // Le champ doit RÉAFFICHER 15 au rechargement (le bug major : numeric renvoyé
    // en string par PostgREST → Number.isFinite faux → champ vide).
    await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('#employee_discount_pct')).toHaveValue('15', { timeout: 30_000 })

    // Bande « Promo empleados/employés · −15 % » visible (taux propagé via getShopSettings).
    await expect(page.getByText(/15\s*%/).first()).toBeVisible({ timeout: 30_000 })
  })

  test('vente comptoir remisée → total recalculé serveur → reçu non-fiscal sans coût', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await loginAdmin(page)
    await page.request.patch('/api/admin/settings', {
      headers: { Origin: ORIGIN },
      data: { employee_discount_pct: 15 },
    })

    // Vente comptoir remisée, ligne LIBRE (aucun stock réel), liée au test user.
    const create = await page.request.post('/api/admin/reservations', {
      headers: { Origin: ORIGIN },
      data: {
        sold: true,
        apply_employee_discount: true,
        user_id: admin.id,
        contact_name: 'Playwright Reçu',
        items: [{ product_name: 'E2E ligne test', unit_price: 100, quantity: 2 }],
      },
    })
    expect(create.ok()).toBeTruthy()
    const { id } = (await create.json()) as { id: string }
    expect(id).toBeTruthy()

    // Total facturé = 200 × (1 − 0,15) = 170 (recompute serveur, jamais du client).
    const { data: resv } = await supabaseAdmin
      .from('reservations')
      .select('status, total_price')
      .eq('id', id)
      .single()
    expect(resv?.status).toBe('collected')
    expect(Number(resv?.total_price)).toBeCloseTo(170, 2)

    // Reçu HTML.
    const receipt = await page.request.get(`/api/admin/reservations/${id}/invoice?lang=fr`, {
      headers: { Origin: ORIGIN },
    })
    expect(receipt.ok()).toBeTruthy()
    expect(receipt.headers()['content-type']).toContain('text/html')
    const html = await receipt.text()
    expect(html).toContain('170') // total remisé présent (170,00)
    expect(html.toLowerCase()).toContain('non fiscal') // mention non-fiscale (fr)
    expect(html).not.toMatch(/unit_cost|cost_price/) // aucune fuite de coût

    // Void (restaure le stock — ici ligne libre, sans effet) ; la résa cascade au cleanup.
    const voided = await page.request.patch('/api/admin/reservations', {
      headers: { Origin: ORIGIN },
      data: { id, status: 'cancelled' },
    })
    expect(voided.ok()).toBeTruthy()
  })

  test('reçu refusé (409) tant que la vente n’est pas collectée', async ({ page }) => {
    test.setTimeout(90_000)
    await loginAdmin(page)

    // Réservation en attente (sold:false → pending), ligne libre, liée au test user.
    const create = await page.request.post('/api/admin/reservations', {
      headers: { Origin: ORIGIN },
      data: {
        sold: false,
        user_id: admin.id,
        contact_name: 'Playwright Pending',
        items: [{ product_name: 'E2E pending', unit_price: 50, quantity: 1 }],
      },
    })
    expect(create.ok()).toBeTruthy()
    const { id } = (await create.json()) as { id: string }

    const receipt = await page.request.get(`/api/admin/reservations/${id}/invoice`, {
      headers: { Origin: ORIGIN },
    })
    expect(receipt.status()).toBe(409)

    // Cleanup (cascade aussi au delete user).
    await page.request.patch('/api/admin/reservations', {
      headers: { Origin: ORIGIN },
      data: { id, status: 'cancelled' },
    })
  })
})
