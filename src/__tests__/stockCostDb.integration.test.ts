/**
 * Tests d'INTÉGRATION contre la base Supabase LIVE (projet de prod).
 *
 * ⚠️ Cette suite ÉCRIT dans la DB de production des lignes synthétiques
 * préfixées (`g3btest-…`) puis les NETTOIE (afterAll + re-purge par préfixe).
 * Elle est SKIPPÉE par défaut — pour la lancer explicitement :
 *
 *     RUN_DB_TESTS=1 npx vitest run src/__tests__/stockCostDb.integration.test.ts
 *
 * CONTEXTE (G-3b) : filet de sécurité sur la BRIQUE COMPTABLE (CMP, merma,
 * COGS/marge). On fige ici le comportement ACTUEL de :
 *   - record_stock_entries : capture du coût (CMP), moyenne pondérée sur 2 lots,
 *     idempotence par client_token ; recompute_cost_price (réconciliation à vie) ;
 *   - record_stock_loss (merma) : décrément du stock, snapshot unit_cost = CMP
 *     courant, charge `merma` au coût×qté dans expenses ; coût inconnu → décrément
 *     SANS charge (jamais 0) ; idempotence par client_token ;
 *   - COGS/marge : apply_reservation_collection snapshote unit_cost ; la même
 *     arithmétique que contabilidad/_data.ts → COGS = Σ(unit_cost·qty), CA =
 *     Σ(unit_price·qty), une ligne au coût NULL EXCLUE (jamais comptée 0).
 *
 * Même pattern que pricingDb.integration.test.ts (guard RUN_DB_TESTS, loadEnvConfig
 * forcé, fetch undici serveur, préfixe unique, purge préalable + finale).
 *
 * vitest ne charge pas .env.local → on l'injecte via @next/env.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'
import { fetch as undiciFetch } from 'undici'

// vitest ne charge pas .env.local. @next/env le fait, MAIS :
//  1. il met en cache son résultat (Vite l'a déjà appelé une fois sans les vars
//     du worker) → il faut forceReload (4e arg = true) ;
//  2. quand NODE_ENV === 'test' (défaut vitest), il SAUTE .env.local et ne lit
//     que .env.test(.local)/.env → on bascule temporairement sur 'development'
//     le temps du chargement, puis on restaure NODE_ENV.
{
  const prevNodeEnv = process.env.NODE_ENV
  ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
  loadEnvConfig(process.cwd(), true, console, true)
  ;(process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

// happy-dom fournit un fetch « navigateur » → la passerelle Supabase rejette la
// clé secrète. On passe le fetch natif de Node (undici) → requête « serveur ».
const serverFetch = undiciFetch as unknown as typeof fetch

const RUN = process.env.RUN_DB_TESTS === '1' && !!URL && !!SERVICE_KEY

const HOOK_TIMEOUT = 30_000

// Préfixe unique pour cette exécution (slugs/noms) : `g3btest-` + epoch base36.
const P = 'g3btest-' + Date.now().toString(36)

const iso = (d: Date) => d.toISOString()
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000)

// IDs de fixture, peuplés dans beforeAll.
let svc: SupabaseClient
let brandId: string
let rangeId: string
let productCmpId: string // coût NULL au départ, sert aux tests CMP + recompute
let productMermaId: string // a un coût, sert au test merma « avec charge »
let productNoCostId: string // coût NULL, sert au test merma « sans charge »
let productSaleAId: string // coût connu, vente COGS
let productSaleBId: string // coût NULL, vente exclue de la couverture

// Charges/réservations créées au fil des tests (pour cleanup ciblé en plus du préfixe).
const reservationIds: string[] = []

/**
 * Wrapper de record_stock_entries : les params text/date nullables sont typés
 * string stricts par le générateur Supabase → on caste comme la route
 * src/app/api/admin/stock/entry/route.ts.
 */
async function recordEntry(opts: {
  items: { product_id: string; quantity: number; unit_cost: number; itbis_included?: boolean }[]
  supplier_name?: string | null
  client_token: string
}) {
  const { error } = await svc.rpc('record_stock_entries', {
    p_items: opts.items,
    p_supplier_name: (opts.supplier_name ?? null) as unknown as string,
    p_supplier_rnc: null as unknown as string,
    p_ncf: null as unknown as string,
    p_invoice_date: null as unknown as string,
    p_note: (P + '-note') as unknown as string,
    p_created_by: null as unknown as string,
    p_client_token: opts.client_token,
  })
  return error
}

/** Lit stock + cost_price (CMP) d'un produit (service-role). */
async function readProduct(id: string): Promise<{ stock: number | null; cost_price: number | null }> {
  const { data, error } = await svc
    .from('products')
    .select('stock, cost_price')
    .eq('id', id)
    .single()
  if (error) throw error
  return {
    stock: data?.stock == null ? null : Number(data.stock),
    cost_price: data?.cost_price == null ? null : Number(data.cost_price),
  }
}

// ─────────────────────────────────────────────────────────────────────────────

describe.skipIf(RUN)('stockCostDb.integration (skippé)', () => {
  it('skippé — poser RUN_DB_TESTS=1 + URL/SERVICE_KEY pour lancer ces tests live', () => {
    console.log(
      '[stockCostDb.integration] suite skippée (RUN_DB_TESTS != 1 ou env Supabase manquant)',
    )
    expect(true).toBe(true)
  })
})

describe.skipIf(!RUN)('stockCostDb.integration (DB live — CMP + merma + COGS/marge)', () => {
  beforeAll(async () => {
    svc = createClient(URL as string, SERVICE_KEY as string, {
      auth: { persistSession: false },
      global: { fetch: serverFetch },
    })

    // PURGE PRÉALABLE de tout résidu g3btest-% (run précédent planté).
    await purgeByPrefix()

    // brand → range (les produits n'ont pas besoin de range, mais on en pose un
    // sur productCmp pour rester fidèle au modèle).
    {
      const { data, error } = await svc
        .from('brands')
        .insert({ name: P + '-brand', slug: P + '-brand' })
        .select('id')
        .single()
      if (error) throw error
      brandId = (data as { id: string }).id
    }
    {
      const { data, error } = await svc
        .from('ranges')
        .insert({ brand_id: brandId, name: P + '-range', slug: P + '-range' })
        .select('id')
        .single()
      if (error) throw error
      rangeId = (data as { id: string }).id
    }

    // Helper d'insertion produit (cost_price laissé à NULL — il n'est posé QUE
    // par les RPC de coût ; on ne le seed jamais à la main).
    const mkProduct = async (
      suffix: string,
      opts: { price: number; stock: number | null; range?: boolean },
    ): Promise<string> => {
      const { data, error } = await svc
        .from('products')
        .insert({
          name: P + '-' + suffix,
          slug: P + '-' + suffix,
          price: opts.price,
          currency: 'DOP',
          stock: opts.stock,
          is_active: true,
          range_id: opts.range ? rangeId : null,
        })
        .select('id')
        .single()
      if (error) throw error
      return (data as { id: string }).id
    }

    // CMP : démarre à stock 0, coût NULL (le 1er lot fixe le CMP).
    productCmpId = await mkProduct('cmp', { price: 1000, stock: 0, range: true })
    // Merma avec charge : coût posé via une entrée dans le test (stock 100).
    productMermaId = await mkProduct('merma', { price: 500, stock: 100 })
    // Merma sans charge : reste à coût NULL (stock 30).
    productNoCostId = await mkProduct('nocost', { price: 300, stock: 30 })
    // Vente A : coût connu (entrée dans le test), stock 50.
    productSaleAId = await mkProduct('sale-a', { price: 800, stock: 50 })
    // Vente B : coût NULL (jamais d'entrée), stock 50 → ligne exclue de la couverture.
    productSaleBId = await mkProduct('sale-b', { price: 400, stock: 50 })
  }, HOOK_TIMEOUT)

  afterAll(async () => {
    await fullCleanup()
  }, HOOK_TIMEOUT)

  // ── a. CMP (coût moyen pondéré) ─────────────────────────────────────────────
  it(
    'a · CMP : 1er lot 10@100 fixe cost=100, 2e lot 10@200 → CMP pondéré 150 ; idempotence ; recompute',
    async () => {
      // 1er lot : 10 unités à 100. Produit sans coût → le lot devient le CMP.
      const token1 = crypto.randomUUID()
      expect(await recordEntry({ items: [{ product_id: productCmpId, quantity: 10, unit_cost: 100 }], client_token: token1 })).toBeNull()
      let p = await readProduct(productCmpId)
      expect(p.cost_price).toBe(100)
      expect(p.stock).toBe(10) // 0 + 10

      // Idempotence : rejouer EXACTEMENT le même token ne double NI le stock NI le coût.
      expect(await recordEntry({ items: [{ product_id: productCmpId, quantity: 10, unit_cost: 100 }], client_token: token1 })).toBeNull()
      p = await readProduct(productCmpId)
      expect(p.cost_price).toBe(100)
      expect(p.stock).toBe(10) // INCHANGÉ — pas de 2e insertion

      // 2e lot : 10 unités à 200. CMP pondéré = (10·100 + 10·200) / 20 = 150.
      const token2 = crypto.randomUUID()
      expect(await recordEntry({ items: [{ product_id: productCmpId, quantity: 10, unit_cost: 200 }], client_token: token2 })).toBeNull()
      p = await readProduct(productCmpId)
      expect(p.cost_price).toBe(150)
      expect(p.stock).toBe(20) // 10 + 10

      // recompute_cost_price : moyenne pondérée À VIE sur stock_entries =
      // (10·100 + 10·200) / 20 = 150 (ici identique au CMP incrémental car pas de
      // rupture de stock entre les lots).
      const { error: recErr } = await svc.rpc('recompute_cost_price', { p_product_id: productCmpId })
      expect(recErr).toBeNull()
      p = await readProduct(productCmpId)
      expect(p.cost_price).toBe(150)
    },
    HOOK_TIMEOUT,
  )

  // ── b. Merma / productos vencidos ───────────────────────────────────────────
  it(
    'b · merma : décrément + snapshot unit_cost + charge merma au coût ; produit sans coût = décrément sans charge ; idempotence',
    async () => {
      // Pose un coût sur productMerma : 100 @ 50 (stock 100 → 200, cost = 50).
      const entryToken = crypto.randomUUID()
      expect(await recordEntry({ items: [{ product_id: productMermaId, quantity: 100, unit_cost: 50 }], client_token: entryToken })).toBeNull()
      let pm = await readProduct(productMermaId)
      expect(pm.cost_price).toBe(50)
      expect(pm.stock).toBe(200)

      // Merma de 10 unités (vencido). Décrément 200 → 190, charge = 50·10 = 500.
      const lossToken = crypto.randomUUID()
      const { data: lossRes, error: lossErr } = await svc.rpc('record_stock_loss', {
        p_product_id: productMermaId,
        p_quantity: 10,
        p_reason: 'vencido',
        p_note: (P + '-merma') as unknown as string,
        p_created_by: null as unknown as string,
        p_client_token: lossToken,
      })
      expect(lossErr).toBeNull()
      const loss = lossRes as { replayed: boolean; stock: number | null; unit_cost: number | null; expense_id: string | null }
      expect(loss.replayed).toBe(false)
      expect(Number(loss.stock)).toBe(190)
      expect(Number(loss.unit_cost)).toBe(50)
      expect(loss.expense_id).toBeTruthy()

      // Stock effectivement décrémenté.
      pm = await readProduct(productMermaId)
      expect(pm.stock).toBe(190)

      // Ligne stock_losses : snapshot unit_cost = CMP courant (50), lien expense.
      const { data: slRow } = await svc
        .from('stock_losses')
        .select('quantity, unit_cost, reason, expense_id')
        .eq('client_token', lossToken)
        .single()
      expect(slRow?.quantity).toBe(10)
      expect(Number(slRow?.unit_cost)).toBe(50)
      expect(slRow?.reason).toBe('vencido')
      expect(slRow?.expense_id).toBe(loss.expense_id)

      // Charge créée : catégorie merma, montant = round(50·10) = 500.
      const { data: expRow } = await svc
        .from('expenses')
        .select('amount, category')
        .eq('id', loss.expense_id as string)
        .single()
      expect(expRow?.category).toBe('merma')
      expect(Number(expRow?.amount)).toBe(500)

      // Idempotence : rejouer le même token NE recrée NI charge NI décrément.
      const { data: replayRes, error: replayErr } = await svc.rpc('record_stock_loss', {
        p_product_id: productMermaId,
        p_quantity: 10,
        p_reason: 'vencido',
        p_note: (P + '-merma') as unknown as string,
        p_created_by: null as unknown as string,
        p_client_token: lossToken,
      })
      expect(replayErr).toBeNull()
      expect((replayRes as { replayed: boolean }).replayed).toBe(true)
      pm = await readProduct(productMermaId)
      expect(pm.stock).toBe(190) // INCHANGÉ
      const { count: lossCount } = await svc
        .from('stock_losses')
        .select('id', { count: 'exact', head: true })
        .eq('client_token', lossToken)
      expect(lossCount).toBe(1)

      // Produit SANS coût (cost_price NULL) → décrément SANS charge (jamais 0).
      const noCostToken = crypto.randomUUID()
      const { data: ncRes, error: ncErr } = await svc.rpc('record_stock_loss', {
        p_product_id: productNoCostId,
        p_quantity: 5,
        p_reason: 'danado',
        p_note: (P + '-merma-nocost') as unknown as string,
        p_created_by: null as unknown as string,
        p_client_token: noCostToken,
      })
      expect(ncErr).toBeNull()
      const nc = ncRes as { stock: number | null; unit_cost: number | null; expense_id: string | null }
      expect(Number(nc.stock)).toBe(25) // 30 - 5
      expect(nc.unit_cost).toBeNull() // coût inconnu, snapshot NULL
      expect(nc.expense_id).toBeNull() // AUCUNE charge créée

      // Confirme : la ligne registre existe (unit_cost NULL, expense_id NULL).
      const { data: ncRow } = await svc
        .from('stock_losses')
        .select('unit_cost, expense_id')
        .eq('client_token', noCostToken)
        .single()
      expect(ncRow?.unit_cost).toBeNull()
      expect(ncRow?.expense_id).toBeNull()
    },
    HOOK_TIMEOUT,
  )

  // ── c. COGS / marge (arithmétique contabilidad/_data.ts) ─────────────────────
  it(
    'c · COGS : vente comptoir 2 items (A coût connu, B coût NULL) → unit_cost snapshotté ; COGS=Σ(unit_cost·qty), CA=Σ(unit_price·qty), ligne sans coût EXCLUE',
    async () => {
      // Pose un coût sur A : 20 @ 120 → cost = 120. B reste à coût NULL.
      const entryToken = crypto.randomUUID()
      expect(await recordEntry({ items: [{ product_id: productSaleAId, quantity: 20, unit_cost: 120 }], client_token: entryToken })).toBeNull()
      const pa = await readProduct(productSaleAId)
      expect(pa.cost_price).toBe(120)

      // Réservation comptoir collected avec 2 items à unit_price connus :
      //   A : unit_price 300, qty 2  → revenue 600, cogs 240 (coût 120)
      //   B : unit_price 400, qty 1  → revenue 400, cogs EXCLU (coût NULL)
      const { data: resa, error: resaErr } = await svc
        .from('reservations')
        .insert({
          user_id: null,
          source: 'counter',
          status: 'pending',
          expires_at: iso(daysFromNow(1)),
          total_items: 3,
          total_price: 1000,
          currency: 'DOP',
        })
        .select('id')
        .single()
      expect(resaErr).toBeNull()
      const resaId = (resa as { id: string }).id
      reservationIds.push(resaId)

      const { error: itemsErr } = await svc.from('reservation_items').insert([
        {
          reservation_id: resaId,
          product_id: productSaleAId,
          product_name: P + '-sale-a',
          unit_price: 300,
          quantity: 2,
        },
        {
          reservation_id: resaId,
          product_id: productSaleBId,
          product_name: P + '-sale-b',
          unit_price: 400,
          quantity: 1,
        },
      ])
      expect(itemsErr).toBeNull()

      // collected → apply_reservation_collection snapshote unit_cost (write-once)
      // et décrémente le stock.
      const { error: updErr } = await svc
        .from('reservations')
        .update({ status: 'collected', collected_at: iso(new Date()) })
        .eq('id', resaId)
      expect(updErr).toBeNull()
      const { error: applyErr } = await svc.rpc('apply_reservation_collection', {
        p_reservation_id: resaId,
      })
      expect(applyErr).toBeNull()

      // Relis les 2 items.
      const { data: items } = await svc
        .from('reservation_items')
        .select('product_id, unit_price, unit_cost, quantity')
        .eq('reservation_id', resaId)
      const rows = (items ?? []) as Array<{
        product_id: string
        unit_price: number | string
        unit_cost: number | string | null
        quantity: number
      }>
      const a = rows.find((r) => r.product_id === productSaleAId)!
      const b = rows.find((r) => r.product_id === productSaleBId)!

      // A : unit_cost snapshotté = CMP courant (120) ; B : coût inconnu → NULL.
      expect(Number(a.unit_cost)).toBe(120)
      expect(b.unit_cost).toBeNull()

      // Arithmétique IDENTIQUE à contabilidad/_data.ts :
      //   revenue = unit_price·qty (toujours, même sans coût)
      //   cogs    = unit_cost·qty UNIQUEMENT si unit_cost connu
      //   costedRevenue = revenue des seules lignes à coût connu
      let totalRevenue = 0
      let costedRevenue = 0
      let cogs = 0
      for (const r of rows) {
        const revenue = Number(r.unit_price) * r.quantity
        totalRevenue += revenue
        const hasCost = r.unit_cost !== null && r.unit_cost !== undefined
        if (hasCost) {
          costedRevenue += revenue
          cogs += Number(r.unit_cost) * r.quantity
        }
      }
      // CA total = 600 (A) + 400 (B) = 1000.
      expect(totalRevenue).toBe(1000)
      // COGS = 240 (A seul ; B exclu, JAMAIS compté 0).
      expect(cogs).toBe(240)
      // CA à coût connu = 600 (A seul).
      expect(costedRevenue).toBe(600)
      // Marge sur lignes costées = (600 - 240) / 600 = 0.6 ; couverture = 600/1000 = 0.6.
      expect((costedRevenue - cogs) / costedRevenue).toBeCloseTo(0.6, 10)
      expect(costedRevenue / totalRevenue).toBeCloseTo(0.6, 10)
    },
    HOOK_TIMEOUT,
  )
})

// ───────────────────────────── Cleanup helpers ──────────────────────────────

/** Purge ciblée par les IDs de fixture connus puis re-purge par préfixe. */
async function fullCleanup() {
  const productIds = [
    productCmpId,
    productMermaId,
    productNoCostId,
    productSaleAId,
    productSaleBId,
  ].filter(Boolean)

  // Ordre FK : stock_losses → expenses liées → stock_entries → reservation_items
  // → reservations → product_tags → products → ranges → brands.

  // 1. stock_losses de nos produits (récupère les expense_id liées).
  let expenseIds: string[] = []
  try {
    const { data: losses } = await svc
      .from('stock_losses')
      .select('expense_id')
      .in('product_id', productIds)
    expenseIds = (losses ?? []).map((l) => l.expense_id).filter(Boolean) as string[]
    if (productIds.length) await svc.from('stock_losses').delete().in('product_id', productIds)
  } catch {
    /* */
  }
  // 2. expenses liées aux pertes (la FK stock_losses.expense_id est ON DELETE SET
  //    NULL, donc on supprime les charges après les pertes).
  try {
    if (expenseIds.length) await svc.from('expenses').delete().in('id', expenseIds)
  } catch {
    /* */
  }

  // 3. réservations de fixture (via leurs items pointant nos produits).
  try {
    const { data: items } = await svc
      .from('reservation_items')
      .select('reservation_id')
      .in('product_id', productIds)
    const resaIds = Array.from(
      new Set([...(items ?? []).map((r) => r.reservation_id), ...reservationIds]),
    ).filter(Boolean)
    if (resaIds.length) {
      try {
        await svc.from('reservation_items').delete().in('reservation_id', resaIds)
      } catch {
        /* */
      }
      try {
        await svc.from('reservations').delete().in('id', resaIds)
      } catch {
        /* */
      }
    }
  } catch {
    /* */
  }

  // 4. stock_entries sur nos produits.
  try {
    if (productIds.length) await svc.from('stock_entries').delete().in('product_id', productIds)
  } catch {
    /* */
  }

  // 5. products → ranges → brands.
  try {
    if (productIds.length) await svc.from('products').delete().in('id', productIds)
  } catch {
    /* */
  }
  try {
    if (rangeId) await svc.from('ranges').delete().eq('id', rangeId)
  } catch {
    /* */
  }
  try {
    if (brandId) await svc.from('brands').delete().eq('id', brandId)
  } catch {
    /* */
  }

  // 6. Re-purge par préfixe pour rattraper d'anciens résidus.
  await purgeByPrefix()
}

/**
 * Purge par préfixe `g3btest-%`. Ordre FK : stock_losses + expenses (merma) →
 * reservation_items → reservations → stock_entries → products → ranges → brands.
 */
async function purgeByPrefix() {
  const LIKE = 'g3btest-%'

  // Produits préfixés (pour résoudre les FK enfants).
  let prodIds: string[] = []
  try {
    const { data } = await svc.from('products').select('id').like('slug', LIKE)
    prodIds = (data ?? []).map((p) => p.id)
  } catch {
    /* */
  }

  if (prodIds.length) {
    // stock_losses → expenses liées (merma).
    let expIds: string[] = []
    try {
      const { data: losses } = await svc
        .from('stock_losses')
        .select('expense_id')
        .in('product_id', prodIds)
      expIds = (losses ?? []).map((l) => l.expense_id).filter(Boolean) as string[]
      await svc.from('stock_losses').delete().in('product_id', prodIds)
    } catch {
      /* */
    }
    try {
      if (expIds.length) await svc.from('expenses').delete().in('id', expIds)
    } catch {
      /* */
    }

    // reservation_items → reservations rattachées à ces produits.
    try {
      const { data: items } = await svc
        .from('reservation_items')
        .select('reservation_id')
        .in('product_id', prodIds)
      const resaIds = Array.from(new Set((items ?? []).map((r) => r.reservation_id))).filter(Boolean)
      if (resaIds.length) {
        try {
          await svc.from('reservation_items').delete().in('reservation_id', resaIds)
        } catch {
          /* */
        }
        try {
          await svc.from('reservations').delete().in('id', resaIds)
        } catch {
          /* */
        }
      }
    } catch {
      /* */
    }

    try {
      await svc.from('stock_entries').delete().in('product_id', prodIds)
    } catch {
      /* */
    }
  }

  // Filet : toute charge merma préfixée par sa note (au cas où la liaison a sauté).
  try {
    await svc.from('expenses').delete().eq('category', 'merma').like('note', LIKE)
  } catch {
    /* */
  }

  // products → ranges → brands préfixés.
  try {
    await svc.from('products').delete().like('slug', LIKE)
  } catch {
    /* */
  }
  try {
    await svc.from('ranges').delete().like('slug', LIKE)
  } catch {
    /* */
  }
  try {
    await svc.from('brands').delete().like('slug', LIKE)
  } catch {
    /* */
  }
}
