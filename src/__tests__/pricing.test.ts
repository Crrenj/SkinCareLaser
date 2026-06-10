import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { applyPromo, fetchEffectivePrices, type EffectivePrice } from '@/lib/pricing'

/**
 * FILET DE TESTS — fige le comportement ACTUEL de src/lib/pricing.ts avant la
 * réécriture du moteur de prix (Phase 2) + catalogue (Phase 3).
 *
 *  - `applyPromo` : règle de swap du prix barré (invariant critique). Si une
 *    promo est active (effective < base), on affiche le prix remisé et on barre
 *    `max(base, old_price manuel)` → garantit `oldPrice > price`. Sans promo, le
 *    comportement manuel `old_price` est inchangé.
 *  - `fetchEffectivePrices` : lecture batch de `v_product_pricing` (un seul
 *    `.in(ids)`), dé-duplication + fallbacks NULL.
 */

describe('applyPromo — règle de swap du prix barré', () => {
  it('1. sans pricing (undefined) : price = basePrice, oldPrice = manualOldPrice ?? undefined', () => {
    // Pas de old_price manuel → oldPrice undefined.
    expect(applyPromo(100, undefined, undefined)).toEqual({
      price: 100,
      oldPrice: undefined,
    })
    // old_price manuel renseigné → passe inchangé (aucun swap sans promo).
    expect(applyPromo(100, 150, undefined)).toEqual({
      price: 100,
      oldPrice: 150,
    })
    // old_price manuel null → traité comme absent (?? undefined).
    expect(applyPromo(100, null, undefined)).toEqual({
      price: 100,
      oldPrice: undefined,
    })
  })

  it('2. promo active (effective < base) : price = effective, oldPrice = max(base, manualOldPrice ?? 0)', () => {
    const pricing: EffectivePrice = { base: 100, effective: 80 }
    // Sans old_price manuel → ancre = base.
    expect(applyPromo(100, undefined, pricing)).toEqual({
      price: 80,
      oldPrice: 100,
    })
    expect(applyPromo(100, null, pricing)).toEqual({
      price: 80,
      oldPrice: 100,
    })
  })

  it('3. promo active + old_price manuel SUPÉRIEUR à base : oldPrice = le manuel (ancre la plus haute)', () => {
    const pricing: EffectivePrice = { base: 100, effective: 80 }
    expect(applyPromo(100, 130, pricing)).toEqual({
      price: 80,
      oldPrice: 130,
    })
  })

  it('4. promo active + old_price manuel INFÉRIEUR à base : oldPrice = base', () => {
    const pricing: EffectivePrice = { base: 100, effective: 80 }
    expect(applyPromo(100, 90, pricing)).toEqual({
      price: 80,
      oldPrice: 100,
    })
  })

  it('5. effective == base : branche « pas de promo » (old_price manuel passe inchangé)', () => {
    const pricing: EffectivePrice = { base: 100, effective: 100 }
    // price = base (pas effective), old_price manuel round-trip tel quel.
    expect(applyPromo(100, 150, pricing)).toEqual({
      price: 100,
      oldPrice: 150,
    })
    // sans old_price manuel → undefined.
    expect(applyPromo(100, undefined, pricing)).toEqual({
      price: 100,
      oldPrice: undefined,
    })
  })

  it('6. effective > base (cas anormal) : branche « pas de promo »', () => {
    const pricing: EffectivePrice = { base: 100, effective: 120 }
    // Aucun swap : price = base (effective ignoré, jamais affiché), old_price manuel inchangé.
    expect(applyPromo(100, 150, pricing)).toEqual({
      price: 100,
      oldPrice: 150,
    })
    expect(applyPromo(100, undefined, pricing)).toEqual({
      price: 100,
      oldPrice: undefined,
    })
  })

  it('7. invariant : oldPrice > price dès qu\'une promo est active', () => {
    const cases: Array<{ base: number; eff: number; manual: number | null }> = [
      { base: 100, eff: 80, manual: null },
      { base: 100, eff: 80, manual: 130 },
      { base: 100, eff: 80, manual: 50 },
      { base: 49.99, eff: 39.99, manual: null },
      { base: 100, eff: 1, manual: 999 },
    ]
    for (const c of cases) {
      const { price, oldPrice } = applyPromo(c.base, c.manual, {
        base: c.base,
        effective: c.eff,
      })
      expect(price).toBe(c.eff)
      expect(oldPrice).toBeDefined()
      expect(oldPrice as number).toBeGreaterThan(price)
    }
  })

  it('pricing.base prime sur basePrice quand pricing est fourni (?? n\'écrase pas 0)', () => {
    // pricing.base = 0 (valeur falsy mais non nul/undefined) → garde 0 via ??.
    const pricing: EffectivePrice = { base: 0, effective: 0 }
    // base=0, eff=0 → eff < base faux → price = base = 0.
    expect(applyPromo(100, undefined, pricing)).toEqual({
      price: 0,
      oldPrice: undefined,
    })
  })
})

// Helper : construit un faux client Supabase dont la chaîne
// .from().select().in() résout { data }. Le `inSpy` permet d'asserter qu'il
// n'est PAS appelé (court-circuit ids vides) et avec quels ids.
function makeSupabaseMock(data: unknown) {
  const inSpy = vi.fn().mockResolvedValue({ data })
  const select = vi.fn(() => ({ in: inSpy }))
  const from = vi.fn(() => ({ select }))
  const sb = { from } as unknown as SupabaseClient<Database>
  return { sb, from, select, inSpy }
}

describe('fetchEffectivePrices — lecture batch v_product_pricing', () => {
  it('8a. ids vides → Map vide SANS appel réseau', async () => {
    const { sb, from, inSpy } = makeSupabaseMock([])
    const map = await fetchEffectivePrices(sb, [])
    expect(map.size).toBe(0)
    expect(from).not.toHaveBeenCalled()
    expect(inSpy).not.toHaveBeenCalled()
  })

  it('8b. ids tous null/undefined → Map vide SANS appel réseau', async () => {
    const { sb, from, inSpy } = makeSupabaseMock([])
    const map = await fetchEffectivePrices(sb, [null, undefined, null])
    expect(map.size).toBe(0)
    expect(from).not.toHaveBeenCalled()
    expect(inSpy).not.toHaveBeenCalled()
  })

  it('9. dé-duplication des ids avant .in() (+ filtre les null/undefined intercalés)', async () => {
    const { sb, inSpy } = makeSupabaseMock([])
    await fetchEffectivePrices(sb, ['a', 'a', null, 'b', undefined, 'a'])
    expect(inSpy).toHaveBeenCalledTimes(1)
    expect(inSpy).toHaveBeenCalledWith('product_id', ['a', 'b'])
  })

  it('10. fallback NULL : base=0 si base_price null, effective=base si effective_price null', async () => {
    const { sb } = makeSupabaseMock([
      // base_price null → base = 0 ; effective_price null → effective = base = 0.
      { product_id: 'p1', base_price: null, effective_price: null },
      // base présent, effective null → effective = base.
      { product_id: 'p2', base_price: 100, effective_price: null },
      // base null mais effective présent → base = 0, effective = 50.
      { product_id: 'p3', base_price: null, effective_price: 50 },
      // les deux présents, promo active.
      { product_id: 'p4', base_price: 200, effective_price: 160 },
    ])
    const map = await fetchEffectivePrices(sb, ['p1', 'p2', 'p3', 'p4'])
    expect(map.get('p1')).toEqual({ base: 0, effective: 0 })
    expect(map.get('p2')).toEqual({ base: 100, effective: 100 })
    expect(map.get('p3')).toEqual({ base: 0, effective: 50 })
    expect(map.get('p4')).toEqual({ base: 200, effective: 160 })
  })

  it('11. row avec product_id null → ignorée (pas de clé dans la Map)', async () => {
    const { sb } = makeSupabaseMock([
      { product_id: null, base_price: 10, effective_price: 8 },
      { product_id: 'ok', base_price: 10, effective_price: 8 },
    ])
    const map = await fetchEffectivePrices(sb, ['ok'])
    expect(map.size).toBe(1)
    expect(map.has('ok')).toBe(true)
  })

  it('data null/absent (aucune row remontée) → Map vide mais réseau appelé', async () => {
    const { sb, inSpy } = makeSupabaseMock(null)
    const map = await fetchEffectivePrices(sb, ['x'])
    expect(map.size).toBe(0)
    expect(inSpy).toHaveBeenCalledTimes(1)
  })

  it('coercion : valeurs string numériques sont converties via Number()', async () => {
    // v_product_pricing peut remonter des numeric en string selon le driver.
    const { sb } = makeSupabaseMock([
      { product_id: 'p', base_price: '100.50', effective_price: '80.25' },
    ])
    const map = await fetchEffectivePrices(sb, ['p'])
    expect(map.get('p')).toEqual({ base: 100.5, effective: 80.25 })
  })
})
