/**
 * Tests d'INTÉGRATION contre la base Supabase LIVE (projet de prod).
 *
 * ⚠️ Cette suite ÉCRIT dans la DB de production des lignes synthétiques
 * préfixées (`g3atest-…`) puis les NETTOIE (afterAll + re-purge par préfixe).
 * Elle est SKIPPÉE par défaut — pour la lancer explicitement :
 *
 *     RUN_DB_TESTS=1 npx vitest run src/__tests__/pricingDb.integration.test.ts
 *
 * CONTEXTE (G-3a) : filet de sécurité EXIGÉ avant/après la réécriture du moteur
 * de prix (Phase 2 — early-return sur effective_price) et du catalogue (Phase 3).
 * On fige ici le comportement ACTUEL de :
 *   - effective_price(p_product_id, p_at) : MIN sur toutes les cibles
 *     produit/marque/gamme/tag d'une promo active dans [start_date, end_date),
 *     percent = price·(1-v/100), fixed = price-v, round 2, plancher 0, sinon prix de base ;
 *   - vue publique v_product_pricing (security_invoker → RLS produits respectée,
 *     les INACTIFS n'y apparaissent pas pour anon, aucun coût exposé) ;
 *   - INVARIANT DE DÉCOUPLAGE : la collecte d'une réservation (apply_reservation_collection)
 *     ne réécrit JAMAIS unit_price (le CA compta lit unit_price·qty), pose unit_cost
 *     = CMP (write-once) et décrémente le stock.
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
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// L'environnement de test (happy-dom) fournit un fetch « navigateur » : la
// passerelle Supabase rejette alors la clé SECRÈTE (`sb_secret_…`) avec
// « Forbidden use of secret API key in browser » (empreinte navigateur dans la
// requête, même sans Origin explicite). On passe donc le fetch natif de Node
// (undici, toujours présent) aux clients → requête « serveur », clé acceptée.
const serverFetch = undiciFetch as unknown as typeof fetch

const RUN = process.env.RUN_DB_TESTS === '1' && !!URL && !!SERVICE_KEY

const HOOK_TIMEOUT = 30_000

// Préfixe unique pour cette exécution (slugs/noms) : `g3atest-` + epoch base36.
const P = 'g3atest-' + Date.now().toString(36)

// Dates utiles relatives au présent.
const now = () => new Date()
const iso = (d: Date) => d.toISOString()
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000)

// IDs de fixture, peuplés dans beforeAll.
let svc: SupabaseClient
let anon: SupabaseClient
let brandId: string
let rangeId: string
let tagTypeId: string
let tagId: string
let productAId: string // 1000 DOP, range_id, taggé
let productBId: string // 500 DOP, sans range/brand/tag
let productCId: string // 200 DOP, INACTIF

// Promos créées au fil des tests (pour cleanup ciblé).
const promotionIds: string[] = []

/** Crée une promo + ses cibles, l'enregistre pour cleanup, renvoie l'id. */
async function makePromo(opts: {
  discount_type: 'percent' | 'fixed'
  discount_value: number
  start: Date
  end: Date
  is_active?: boolean
  targets: { target_type: 'product' | 'brand' | 'range' | 'tag'; target_id: string }[]
}): Promise<string> {
  const { data: promo, error } = await svc
    .from('promotions')
    .insert({
      name: P + '-promo',
      discount_type: opts.discount_type,
      discount_value: opts.discount_value,
      start_date: iso(opts.start),
      end_date: iso(opts.end),
      is_active: opts.is_active ?? true,
    })
    .select('id')
    .single()
  if (error) throw error
  const id = (promo as { id: string }).id
  promotionIds.push(id)
  if (opts.targets.length) {
    const { error: tErr } = await svc.from('promotion_targets').insert(
      opts.targets.map((t) => ({ promotion_id: id, target_type: t.target_type, target_id: t.target_id })),
    )
    if (tErr) throw tErr
  }
  return id
}

/** Lit le prix effectif (service-role). */
async function eff(productId: string, client: SupabaseClient = svc): Promise<number> {
  const { data, error } = await client.rpc('effective_price', { p_product_id: productId })
  if (error) throw error
  return Number(data)
}

// ─────────────────────────────────────────────────────────────────────────────

describe.skipIf(RUN)('pricingDb.integration (skippé)', () => {
  it('skippé — poser RUN_DB_TESTS=1 + URL/SERVICE_KEY pour lancer ces tests live', () => {
    console.log(
      '[pricingDb.integration] suite skippée (RUN_DB_TESTS != 1 ou env Supabase manquant)',
    )
    expect(true).toBe(true)
  })
})

describe.skipIf(!RUN)('pricingDb.integration (DB live — moteur de prix + découplage)', () => {
  beforeAll(async () => {
    svc = createClient(URL as string, SERVICE_KEY as string, {
      auth: { persistSession: false },
      global: { fetch: serverFetch },
    })
    anon = createClient(URL as string, ANON_KEY as string, {
      auth: { persistSession: false },
      global: { fetch: serverFetch },
    })

    // PURGE PRÉALABLE de tout résidu g3atest-% (sécurité si un run précédent a planté).
    await purgeByPrefix()

    // brand → range
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

    // tag_type → tag
    {
      const { data, error } = await svc
        .from('tag_types')
        .insert({ name: P + '-ttype', slug: P + '-ttype' })
        .select('id')
        .single()
      if (error) throw error
      tagTypeId = (data as { id: string }).id
    }
    {
      const { data, error } = await svc
        .from('tags')
        .insert({ name: P + '-tag', slug: P + '-tag', tag_type_id: tagTypeId })
        .select('id')
        .single()
      if (error) throw error
      tagId = (data as { id: string }).id
    }

    // produit A : 1000 DOP, range_id, actif
    {
      const { data, error } = await svc
        .from('products')
        .insert({
          name: P + '-prod-a',
          slug: P + '-prod-a',
          price: 1000,
          currency: 'DOP',
          stock: 50,
          is_active: true,
          range_id: rangeId,
        })
        .select('id')
        .single()
      if (error) throw error
      productAId = (data as { id: string }).id
    }
    // lien A ↔ tag
    {
      const { error } = await svc
        .from('product_tags')
        .insert({ product_id: productAId, tag_id: tagId })
      if (error) throw error
    }

    // produit B : 500 DOP, sans range/brand/tag, actif
    {
      const { data, error } = await svc
        .from('products')
        .insert({
          name: P + '-prod-b',
          slug: P + '-prod-b',
          price: 500,
          currency: 'DOP',
          stock: 10,
          is_active: true,
          range_id: null,
        })
        .select('id')
        .single()
      if (error) throw error
      productBId = (data as { id: string }).id
    }

    // produit C : 200 DOP, INACTIF
    {
      const { data, error } = await svc
        .from('products')
        .insert({
          name: P + '-prod-c',
          slug: P + '-prod-c',
          price: 200,
          currency: 'DOP',
          stock: 5,
          is_active: false,
        })
        .select('id')
        .single()
      if (error) throw error
      productCId = (data as { id: string }).id
    }
  }, HOOK_TIMEOUT)

  afterAll(async () => {
    await fullCleanup()
  }, HOOK_TIMEOUT)

  // ── 1. Sans promo ──────────────────────────────────────────────────────────
  it(
    '1 · sans aucune promo, effective_price(A) renvoie le prix de base (1000)',
    async () => {
      expect(await eff(productAId)).toBe(1000)
    },
    HOOK_TIMEOUT,
  )

  // ── 2. Promo percent ciblant le PRODUIT ─────────────────────────────────────
  it(
    '2 · promo percent 20% ciblant le PRODUIT A → 800',
    async () => {
      const id = await makePromo({
        discount_type: 'percent',
        discount_value: 20,
        start: daysFromNow(-1),
        end: daysFromNow(1),
        targets: [{ target_type: 'product', target_id: productAId }],
      })
      try {
        expect(await eff(productAId)).toBe(800)
      } finally {
        await dropPromo(id)
      }
    },
    HOOK_TIMEOUT,
  )

  // ── 3. fixed sur la RANGE ; cumul → MIN ─────────────────────────────────────
  it(
    '3 · fixed 100 sur la RANGE → 900 seule ; combinée à la percent 20% → MIN = 800',
    async () => {
      const fixedId = await makePromo({
        discount_type: 'fixed',
        discount_value: 100,
        start: daysFromNow(-1),
        end: daysFromNow(1),
        targets: [{ target_type: 'range', target_id: rangeId }],
      })
      try {
        // Seule : 1000 - 100 = 900.
        expect(await eff(productAId)).toBe(900)

        // Avec la percent 20% (=800) en parallèle → meilleur prix client = MIN(900, 800) = 800.
        const pctId = await makePromo({
          discount_type: 'percent',
          discount_value: 20,
          start: daysFromNow(-1),
          end: daysFromNow(1),
          targets: [{ target_type: 'product', target_id: productAId }],
        })
        try {
          expect(await eff(productAId)).toBe(800)
        } finally {
          await dropPromo(pctId)
        }
      } finally {
        await dropPromo(fixedId)
      }
    },
    HOOK_TIMEOUT,
  )

  // ── 4. Fan-out brand / tag ; B reste intact ─────────────────────────────────
  it(
    '4 · promo BRAND s’applique à A, promo TAG s’applique à A, aucune ne touche B (500)',
    async () => {
      const brandPromo = await makePromo({
        discount_type: 'percent',
        discount_value: 10,
        start: daysFromNow(-1),
        end: daysFromNow(1),
        targets: [{ target_type: 'brand', target_id: brandId }],
      })
      try {
        // brand → A : 1000·0.9 = 900 ; B (sans brand/range/tag) inchangé.
        expect(await eff(productAId)).toBe(900)
        expect(await eff(productBId)).toBe(500)
      } finally {
        await dropPromo(brandPromo)
      }

      const tagPromo = await makePromo({
        discount_type: 'fixed',
        discount_value: 250,
        start: daysFromNow(-1),
        end: daysFromNow(1),
        targets: [{ target_type: 'tag', target_id: tagId }],
      })
      try {
        // tag → A (taggé) : 1000 - 250 = 750 ; B (non taggé) inchangé.
        expect(await eff(productAId)).toBe(750)
        expect(await eff(productBId)).toBe(500)
      } finally {
        await dropPromo(tagPromo)
      }
    },
    HOOK_TIMEOUT,
  )

  // ── 5. Fenêtre de dates + is_active ─────────────────────────────────────────
  it(
    '5 · promo expirée / future / désactivée → aucune remise (1000)',
    async () => {
      // Expirée (end hier).
      const expired = await makePromo({
        discount_type: 'percent',
        discount_value: 50,
        start: daysFromNow(-3),
        end: daysFromNow(-1),
        targets: [{ target_type: 'product', target_id: productAId }],
      })
      try {
        expect(await eff(productAId)).toBe(1000)
      } finally {
        await dropPromo(expired)
      }

      // Future (start demain).
      const future = await makePromo({
        discount_type: 'percent',
        discount_value: 50,
        start: daysFromNow(1),
        end: daysFromNow(3),
        targets: [{ target_type: 'product', target_id: productAId }],
      })
      try {
        expect(await eff(productAId)).toBe(1000)
      } finally {
        await dropPromo(future)
      }

      // Active dans la fenêtre mais is_active = false.
      const disabled = await makePromo({
        discount_type: 'percent',
        discount_value: 50,
        start: daysFromNow(-1),
        end: daysFromNow(1),
        is_active: false,
        targets: [{ target_type: 'product', target_id: productAId }],
      })
      try {
        expect(await eff(productAId)).toBe(1000)
      } finally {
        await dropPromo(disabled)
      }
    },
    HOOK_TIMEOUT,
  )

  // ── 6. Plancher à 0 ─────────────────────────────────────────────────────────
  it(
    '6 · fixed 2000 sur A (> prix) → plancher GREATEST(0, …) = 0',
    async () => {
      const id = await makePromo({
        discount_type: 'fixed',
        discount_value: 2000,
        start: daysFromNow(-1),
        end: daysFromNow(1),
        targets: [{ target_type: 'product', target_id: productAId }],
      })
      try {
        expect(await eff(productAId)).toBe(0)
      } finally {
        await dropPromo(id)
      }
    },
    HOOK_TIMEOUT,
  )

  // ── 7. Vue publique v_product_pricing côté ANON (RLS + invoker) ──────────────
  it(
    '7 · v_product_pricing (anon) : A remisé visible, C inactif ABSENT, rpc effective_price anon OK',
    async () => {
      const id = await makePromo({
        discount_type: 'percent',
        discount_value: 20,
        start: daysFromNow(-1),
        end: daysFromNow(1),
        targets: [{ target_type: 'product', target_id: productAId }],
      })
      try {
        // Produit A via la vue, client ANON.
        const { data: rowA, error: errA } = await anon
          .from('v_product_pricing')
          .select('product_id, base_price, effective_price, currency')
          .eq('product_id', productAId)
          .single()
        expect(errA).toBeNull()
        expect(Number(rowA?.base_price)).toBe(1000)
        expect(Number(rowA?.effective_price)).toBe(800)
        expect(rowA?.currency).toBe('DOP')

        // Produit C INACTIF : ABSENT du résultat anon (RLS « View active products »
        // + security_invoker). Régression = gotcha promo-pricing-public-view.
        const { data: rowsC, error: errC } = await anon
          .from('v_product_pricing')
          .select('product_id')
          .eq('product_id', productCId)
        expect(errC).toBeNull()
        expect(rowsC ?? []).toHaveLength(0)

        // Bonus : anon a le droit d'EXECUTE effective_price (GRANT voulu, n'expose aucun coût).
        expect(await eff(productAId, anon)).toBe(800)
      } finally {
        await dropPromo(id)
      }
    },
    HOOK_TIMEOUT,
  )

  // ── 8. 🔒 INVARIANT DÉCOUPLAGE prix/coût ────────────────────────────────────
  it(
    '8 · collecte : unit_price NON réécrit (CA compta), unit_cost = CMP (snapshot), stock décrémenté',
    async () => {
      // a) Pose un coût réel sur A via record_stock_entries (CMP) : 10 u. à 400.
      const stockToken = crypto.randomUUID()
      const { error: entryErr } = await svc.rpc('record_stock_entries', {
        p_items: [{ product_id: productAId, quantity: 10, unit_cost: 400 }],
        // params text/date nullables à l'exécution mais typés string stricts par le générateur → cast.
        p_supplier_name: (P + '-supplier') as unknown as string,
        p_supplier_rnc: null as unknown as string,
        p_ncf: null as unknown as string,
        p_invoice_date: null as unknown as string,
        p_note: (P + '-note') as unknown as string,
        p_created_by: null as unknown as string,
        p_client_token: stockToken,
      })
      expect(entryErr).toBeNull()

      // cost_price (CMP) == 400 — A n'avait pas de coût ; le lot devient le CMP.
      const { data: prodAfterEntry } = await svc
        .from('products')
        .select('stock, cost_price')
        .eq('id', productAId)
        .single()
      expect(Number(prodAfterEntry?.cost_price)).toBe(400)
      // L'entrée a aussi incrémenté le stock : 50 + 10 = 60.
      const stockBeforeSale = Number(prodAfterEntry?.stock)
      expect(stockBeforeSale).toBe(60)

      // b) Réservation comptoir (user_id null, source counter, pending), avec un
      //    prix de ligne SURCHARGÉ admin (750) ≠ effective (800) et ≠ base (1000).
      const { data: resa, error: resaErr } = await svc
        .from('reservations')
        .insert({
          user_id: null,
          source: 'counter',
          status: 'pending',
          expires_at: iso(daysFromNow(1)),
          total_items: 2,
          total_price: 1500,
          currency: 'DOP',
        })
        .select('id')
        .single()
      expect(resaErr).toBeNull()
      const resaId = (resa as { id: string }).id

      const { data: item, error: itemErr } = await svc
        .from('reservation_items')
        .insert({
          reservation_id: resaId,
          product_id: productAId,
          product_name: P + '-prod-a',
          unit_price: 750, // prix surchargé admin
          quantity: 2,
        })
        .select('id')
        .single()
      expect(itemErr).toBeNull()
      const itemId = (item as { id: string }).id

      // c) Passe en collected puis applique la collecte.
      const { error: updErr } = await svc
        .from('reservations')
        .update({ status: 'collected', collected_at: iso(now()) })
        .eq('id', resaId)
      expect(updErr).toBeNull()

      const { error: applyErr } = await svc.rpc('apply_reservation_collection', {
        p_reservation_id: resaId,
      })
      expect(applyErr).toBeNull()

      // d) Relis l'item : unit_price TOUJOURS 750 (jamais réécrit depuis effective_price),
      //    unit_cost == 400 (snapshot CMP write-once).
      const { data: itemAfter } = await svc
        .from('reservation_items')
        .select('unit_price, unit_cost, quantity')
        .eq('id', itemId)
        .single()
      expect(Number(itemAfter?.unit_price)).toBe(750)
      expect(Number(itemAfter?.unit_cost)).toBe(400)

      // CA compta lu par contabilidad/_data.ts = unit_price·qty = 1500.
      expect(Number(itemAfter?.unit_price) * Number(itemAfter?.quantity)).toBe(1500)

      // e) Stock de A décrémenté de 2 (60 → 58).
      const { data: prodAfterSale } = await svc
        .from('products')
        .select('stock')
        .eq('id', productAId)
        .single()
      expect(Number(prodAfterSale?.stock)).toBe(stockBeforeSale - 2)
    },
    HOOK_TIMEOUT,
  )
})

// ───────────────────────────── Cleanup helpers ──────────────────────────────

/** Supprime une promo + ses cibles (CASCADE sur targets via FK, mais on retire l'id du registre). */
async function dropPromo(id: string) {
  try {
    await svc.from('promotion_targets').delete().eq('promotion_id', id)
  } catch {
    /* best-effort */
  }
  try {
    await svc.from('promotions').delete().eq('id', id)
  } catch {
    /* best-effort */
  }
  const idx = promotionIds.indexOf(id)
  if (idx >= 0) promotionIds.splice(idx, 1)
}

/** Purge ciblée par les IDs de fixture connus (ordre FK), best-effort par étape. */
async function fullCleanup() {
  // 1. Réservations de fixture (par préfixe sur contact/product_name impossible ;
  //    on cible via les items qui pointent les produits de fixture).
  const productIds = [productAId, productBId, productCId].filter(Boolean)

  try {
    // reservation_items → reservations : trouve les résas via items pointant nos produits.
    const { data: items } = await svc
      .from('reservation_items')
      .select('reservation_id')
      .in('product_id', productIds)
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

  // 2. stock_entries sur nos produits.
  try {
    if (productIds.length) await svc.from('stock_entries').delete().in('product_id', productIds)
  } catch {
    /* */
  }

  // 3. promotions restantes (par préfixe nom).
  try {
    const { data: promos } = await svc.from('promotions').select('id').like('name', P + '%')
    const ids = (promos ?? []).map((p) => p.id)
    if (ids.length) {
      try {
        await svc.from('promotion_targets').delete().in('promotion_id', ids)
      } catch {
        /* */
      }
      try {
        await svc.from('promotions').delete().in('id', ids)
      } catch {
        /* */
      }
    }
  } catch {
    /* */
  }

  // 4. product_tags → tags → tag_types.
  try {
    if (productIds.length) await svc.from('product_tags').delete().in('product_id', productIds)
  } catch {
    /* */
  }
  try {
    if (tagId) await svc.from('tags').delete().eq('id', tagId)
  } catch {
    /* */
  }
  try {
    if (tagTypeId) await svc.from('tag_types').delete().eq('id', tagTypeId)
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
 * Purge par préfixe `g3atest-%` (rattrape les résidus d'un run précédent planté).
 * Ordre FK : items → reservations (via produits préfixés) → stock_entries →
 * promotion_targets → promotions → product_tags → tags → tag_types → products →
 * ranges → brands.
 */
async function purgeByPrefix() {
  const LIKE = 'g3atest-%'

  // Produits préfixés (pour résoudre les FK enfants).
  let prodIds: string[] = []
  try {
    const { data } = await svc.from('products').select('id').like('slug', LIKE)
    prodIds = (data ?? []).map((p) => p.id)
  } catch {
    /* */
  }

  // reservation_items → reservations rattachées à ces produits.
  try {
    if (prodIds.length) {
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
      try {
        await svc.from('stock_entries').delete().in('product_id', prodIds)
      } catch {
        /* */
      }
      try {
        await svc.from('product_tags').delete().in('product_id', prodIds)
      } catch {
        /* */
      }
    }
  } catch {
    /* */
  }

  // promotions préfixées (+ targets).
  try {
    const { data: promos } = await svc.from('promotions').select('id').like('name', LIKE)
    const ids = (promos ?? []).map((p) => p.id)
    if (ids.length) {
      try {
        await svc.from('promotion_targets').delete().in('promotion_id', ids)
      } catch {
        /* */
      }
      try {
        await svc.from('promotions').delete().in('id', ids)
      } catch {
        /* */
      }
    }
  } catch {
    /* */
  }

  // tags → tag_types préfixés.
  try {
    await svc.from('tags').delete().like('slug', LIKE)
  } catch {
    /* */
  }
  try {
    await svc.from('tag_types').delete().like('slug', LIKE)
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
