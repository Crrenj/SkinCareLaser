import { test, expect, type Page } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  supabaseAdmin,
  type TestUser,
} from './_helpers/test-users'

/**
 * QA navigateur des features de la remédiation 2026-06-10→11 (one-off, NON
 * destiné à la CI — fixtures préfixées « QA Remediation », nettoyées en
 * afterAll) :
 *   1. L-2  — drawer « Initialiser l'inventaire » AVEC coût (réception + prix
 *             + activation) puis SANS coût (ajuste).
 *   2. P-FLEX — édition du prix facturé d'une ligne de réservation
 *             (pending) + recalcul du total + audit log high-impact.
 *   3. G-2  — effacement de compte self-service : user supprimé, réservations
 *             détachées + anonymisées (compta préservée).
 */

let admin: TestUser
let user: TestUser
let productAId: string
let productBId: string
let reservationId: string
let userReservationId: string

test.describe.configure({ mode: 'serial' })

test.describe('QA remédiation — L-2 / P-FLEX / G-2', () => {
  test.use({ navigationTimeout: 60_000, actionTimeout: 30_000 })

  test.beforeAll(async () => {
    admin = await createTestUser({ isAdmin: true })
    user = await createTestUser()

    // Produits de test (inactifs, stock 0, prix placeholder — état post-L-1).
    const { data: pa, error: ea } = await supabaseAdmin
      .from('products')
      .insert({
        name: 'QA Remediation Init A',
        slug: 'qa-remediation-init-a',
        price: 100,
        stock: 0,
        is_active: false,
        currency: 'DOP',
      })
      .select('id')
      .single()
    if (ea) throw ea
    productAId = pa.id

    const { data: pb, error: eb } = await supabaseAdmin
      .from('products')
      .insert({
        name: 'QA Remediation Init B',
        slug: 'qa-remediation-init-b',
        price: 100,
        stock: 0,
        is_active: false,
        currency: 'DOP',
      })
      .select('id')
      .single()
    if (eb) throw eb
    productBId = pb.id

    // Réservation comptoir pending (item libre, sans produit réel) pour P-FLEX.
    const { data: r, error: er } = await supabaseAdmin
      .from('reservations')
      .insert({
        user_id: null,
        source: 'counter',
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        contact_name: 'QA Remediation Cliente',
        contact_phone: '+18090000000',
        total_items: 2,
        total_price: 200,
        currency: 'DOP',
      })
      .select('id')
      .single()
    if (er) throw er
    reservationId = r.id
    const { error: ei } = await supabaseAdmin.from('reservation_items').insert({
      reservation_id: reservationId,
      product_id: null,
      product_name: 'QA Remediation Item',
      unit_price: 100,
      quantity: 2,
    })
    if (ei) throw ei

    // Réservation rattachée au user à supprimer (G-2 : doit survivre anonymisée).
    const { data: ur, error: eur } = await supabaseAdmin
      .from('reservations')
      .insert({
        user_id: user.id,
        source: 'account',
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        contact_name: 'QA Remediation User',
        contact_phone: '+18091111111',
        contact_email: user.email,
        total_items: 1,
        total_price: 300,
        currency: 'DOP',
      })
      .select('id')
      .single()
    if (eur) throw eur
    userReservationId = ur.id
    await supabaseAdmin.from('reservation_items').insert({
      reservation_id: userReservationId,
      product_id: null,
      product_name: 'QA Remediation User Item',
      unit_price: 300,
      quantity: 1,
    })
  })

  test.afterAll(async () => {
    // Ordre FK : items → réservations → entrées de stock → produits → users.
    for (const rid of [reservationId, userReservationId]) {
      if (!rid) continue
      await supabaseAdmin.from('reservation_items').delete().eq('reservation_id', rid)
      await supabaseAdmin.from('reservations').delete().eq('id', rid)
    }
    for (const pid of [productAId, productBId]) {
      if (!pid) continue
      await supabaseAdmin.from('stock_entries').delete().eq('product_id', pid)
      await supabaseAdmin.from('products').delete().eq('id', pid)
    }
    if (admin) await deleteTestUser(admin.id).catch(() => undefined)
    if (user) await deleteTestUser(user.id).catch(() => undefined)
  })

  async function login(page: Page, who: TestUser, expectAdmin: boolean) {
    await page.addInitScript(() => {
      window.localStorage.setItem('farmau:cookies:consent', 'accepted')
    })
    await page.goto('/fr/login', { waitUntil: 'load' })
    await page.locator('#email').waitFor({ state: 'attached' })
    await page.locator('#email').fill(who.email)
    await page.locator('#password').fill(who.password)
    await Promise.all([
      expectAdmin
        ? page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 })
        : // user simple : attendre d'avoir QUITTÉ /login (le pattern /fr/
          // matcherait aussi /fr/login avant la pose de session).
          page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 }),
      page.getByRole('button', { name: /se connecter/i }).click(),
    ])
  }

  test('L-2 · init AVEC coût → réception + prix + activation', async ({ page }) => {
    await login(page, admin, true)
    await page.goto('/admin/stock')
    await page.getByPlaceholder(/rechercher|buscar|search/i).fill('QA Remediation Init A')
    const initBtn = page.getByRole('button', { name: "Initialiser l'inventaire de QA Remediation Init A" })
    await expect(initBtn).toBeVisible({ timeout: 30_000 })
    await initBtn.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // 1er input number = quantité (stepper), puis #init-cost, #init-price.
    await dialog.locator('input[type="number"]').first().fill('12')
    await dialog.locator('#init-cost').fill('80')
    await dialog.locator('#init-price').fill('450')
    // « Activer le produit » coché par défaut (produit inactif).
    await expect(dialog.locator('input[type="checkbox"]')).toBeChecked()
    await dialog.getByRole('button', { name: 'Initialiser' }).click()

    await expect(page.getByText('Produit initialisé')).toBeVisible({ timeout: 30_000 })
    await expect(dialog).toBeHidden()

    await expect
      .poll(
        async () => {
          const { data } = await supabaseAdmin
            .from('products')
            .select('stock, cost_price, price, is_active')
            .eq('id', productAId)
            .single()
          return data
        },
        { timeout: 15_000 },
      )
      .toEqual({ stock: 12, cost_price: 80, price: 450, is_active: true })

    const { count } = await supabaseAdmin
      .from('stock_entries')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productAId)
    expect(count).toBe(1)
  })

  test('L-2 · init SANS coût → ajuste (stock absolu, pas de coût ni 606)', async ({ page }) => {
    await login(page, admin, true)
    await page.goto('/admin/stock')
    await page.getByPlaceholder(/rechercher|buscar|search/i).fill('QA Remediation Init B')
    const initBtn = page.getByRole('button', { name: "Initialiser l'inventaire de QA Remediation Init B" })
    await expect(initBtn).toBeVisible({ timeout: 30_000 })
    await initBtn.click()

    const dialog = page.getByRole('dialog')
    await dialog.locator('input[type="number"]').first().fill('5')
    await dialog.locator('#init-price').fill('250')
    await dialog.getByRole('button', { name: 'Initialiser' }).click()

    await expect(page.getByText('Produit initialisé')).toBeVisible({ timeout: 30_000 })

    await expect
      .poll(
        async () => {
          const { data } = await supabaseAdmin
            .from('products')
            .select('stock, cost_price, price, is_active')
            .eq('id', productBId)
            .single()
          return data
        },
        { timeout: 15_000 },
      )
      .toEqual({ stock: 5, cost_price: null, price: 250, is_active: true })

    const { count } = await supabaseAdmin
      .from('stock_entries')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productBId)
    expect(count).toBe(0)
  })

  test('P-FLEX · édition du prix facturé (pending) + total recalculé + audit high-impact', async ({ page }) => {
    await login(page, admin, true)
    await page.goto('/admin/reservations')
    const row = page.getByRole('row').filter({ hasText: 'QA Remediation Cliente' })
    await expect(row).toBeVisible({ timeout: 30_000 })
    await row.click()

    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    await drawer.getByRole('button', { name: 'Ajuster le prix' }).click()
    const priceInput = drawer.getByLabel('Ajuster le prix')
    await priceInput.fill('80')
    await drawer.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page.getByText('Prix ajusté — total recalculé')).toBeVisible({ timeout: 30_000 })

    await expect
      .poll(
        async () => {
          const { data: item } = await supabaseAdmin
            .from('reservation_items')
            .select('unit_price')
            .eq('reservation_id', reservationId)
            .single()
          const { data: res } = await supabaseAdmin
            .from('reservations')
            .select('total_price')
            .eq('id', reservationId)
            .single()
          return { unit_price: item?.unit_price, total: res?.total_price }
        },
        { timeout: 15_000 },
      )
      .toEqual({ unit_price: 80, total: 160 })

    // Trace d'audit nominative high-impact.
    const { data: logs } = await supabaseAdmin
      .from('audit_log')
      .select('action, entity, is_high_impact, diff, actor_id')
      .eq('entity', 'reservation')
      .eq('entity_id', reservationId)
      .order('created_at', { ascending: false })
      .limit(1)
    expect(logs?.[0]?.is_high_impact).toBe(true)
    expect(logs?.[0]?.actor_id).toBe(admin.id)
    const diff = logs?.[0]?.diff as { unit_price?: { old: number; new: number } }
    expect(diff?.unit_price).toEqual({ old: 100, new: 80 })
  })

  test('G-2 · effacement de compte : user supprimé, réservation détachée + anonymisée', async ({ page }) => {
    await login(page, user, false)
    await page.goto('/fr/account/security')
    await page.locator('#delete-confirm').fill('ELIMINAR')
    await page.getByRole('button', { name: 'Supprimer définitivement' }).click()

    // Redirigé hors du compte après signOut.
    await page.waitForURL((url) => !url.pathname.includes('/account'), { timeout: 30_000 })

    // Le compte auth n'existe plus.
    await expect
      .poll(
        async () => {
          const { data, error } = await supabaseAdmin.auth.admin.getUserById(user.id)
          return error || !data?.user ? 'gone' : 'present'
        },
        { timeout: 15_000 },
      )
      .toBe('gone')

    // La réservation SURVIT (compta) mais détachée + anonymisée.
    const { data: res } = await supabaseAdmin
      .from('reservations')
      .select('user_id, contact_name, contact_phone, contact_email, total_price')
      .eq('id', userReservationId)
      .single()
    expect(res).toEqual({
      user_id: null,
      contact_name: null,
      contact_phone: null,
      contact_email: null,
      total_price: 300,
    })
  })
})
