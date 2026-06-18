import { describe, expect, it } from 'vitest'
import { productCreate, productUpdate, cartItemBody, reservationCreate } from '@/lib/schemas'

/**
 * Garde-fous de validation côté API. Couvre :
 *  - C-09 : mass-assignment fermé (les clés hors-schéma sont retirées par Zod,
 *    donc `parsed.data` ne peut pas porter is_active/id/old_price/… injectés).
 *  - C-13 / C-28 : cap quantité panier 1..99.
 */
describe('productCreate (mass-assignment — C-09)', () => {
  const valid = { name: 'Crème', slug: 'creme', price: 100 }

  it('accepte une charge légitime', () => {
    const r = productCreate.safeParse(valid)
    expect(r.success).toBe(true)
  })

  it('retire les clés hors-schéma (is_active, stock, is_featured, old_price, currency, id, created_at)', () => {
    const r = productCreate.safeParse({
      ...valid,
      is_active: true,
      stock: 5, // géré uniquement sur l'écran Stock — strippé ici
      is_featured: true,
      old_price: 1,
      currency: 'USD',
      id: '00000000-0000-0000-0000-000000000000',
      created_at: '2020-01-01',
    })
    expect(r.success).toBe(true)
    if (!r.success) return
    // Les champs injectés ne survivent PAS dans data → la route les ignore.
    expect(r.data).not.toHaveProperty('is_active')
    expect(r.data).not.toHaveProperty('stock')
    expect(r.data).not.toHaveProperty('is_featured')
    expect(r.data).not.toHaveProperty('old_price')
    expect(r.data).not.toHaveProperty('currency')
    expect(r.data).not.toHaveProperty('id')
    expect(r.data).not.toHaveProperty('created_at')
    expect(Object.keys(r.data).sort()).toEqual(['name', 'price', 'slug'])
  })

  it('rejette les champs requis manquants ou invalides', () => {
    expect(productCreate.safeParse({ slug: 'x', price: 1 }).success).toBe(false) // name
    expect(productCreate.safeParse({ name: 'x', price: 1 }).success).toBe(false) // slug
    expect(productCreate.safeParse({ name: 'x', slug: '', price: 1 }).success).toBe(false) // slug vide
    expect(productCreate.safeParse({ ...valid, price: -1 }).success).toBe(false) // prix négatif
  })
})

describe('productUpdate (mass-assignment — C-09)', () => {
  it('retire aussi les clés hors-schéma', () => {
    const r = productUpdate.safeParse({ price: 50, is_active: false, id: 'abc' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data).not.toHaveProperty('is_active')
    expect(r.data).not.toHaveProperty('id')
    expect(r.data).toEqual({ price: 50 })
  })
})

describe('cartItemBody (cap quantité — C-13 / C-28)', () => {
  const uuid = '11111111-1111-4111-8111-111111111111' // format v4 valide (Zod .uuid())

  it('accepte 1..99 avec un UUID valide', () => {
    expect(cartItemBody.safeParse({ productId: uuid, quantity: 1 }).success).toBe(true)
    expect(cartItemBody.safeParse({ productId: uuid, quantity: 99 }).success).toBe(true)
  })

  it('rejette quantity < 1, > 99 ou non-entière', () => {
    expect(cartItemBody.safeParse({ productId: uuid, quantity: 0 }).success).toBe(false)
    expect(cartItemBody.safeParse({ productId: uuid, quantity: 100 }).success).toBe(false)
    expect(cartItemBody.safeParse({ productId: uuid, quantity: 2.5 }).success).toBe(false)
  })

  it('rejette un productId non-UUID', () => {
    expect(cartItemBody.safeParse({ productId: 'not-a-uuid', quantity: 1 }).success).toBe(false)
  })
})

describe('reservationCreate (anti-manipulation remise employé — vente comptoir)', () => {
  const item = { product_name: 'Crème', unit_price: 100, quantity: 2 }

  it('strippe les champs de prix/remise injectés par le client (top-level + items)', () => {
    const r = reservationCreate.safeParse({
      items: [{ ...item, discounted_price: 0, discount_pct: 99, unit_cost: 0 }],
      employee_discount_pct: 50,
      discount_pct: 99,
      total_price: 1,
      status: 'collected',
    })
    expect(r.success).toBe(true)
    if (!r.success) return
    // Le client ne peut imposer ni un taux, ni un prix remisé, ni un total, ni un statut.
    expect(r.data).not.toHaveProperty('employee_discount_pct')
    expect(r.data).not.toHaveProperty('discount_pct')
    expect(r.data).not.toHaveProperty('total_price')
    expect(r.data).not.toHaveProperty('status')
    // L'item ne garde que les champs légitimes (pas de prix remisé / coût injecté).
    expect(r.data.items[0]).toEqual({ product_name: 'Crème', unit_price: 100, quantity: 2 })
  })

  it('apply_employee_discount défaut false (omis) et n’accepte qu’un booléen', () => {
    const r = reservationCreate.safeParse({ items: [item] })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.apply_employee_discount).toBe(false)
    expect(r.data.sold).toBe(false)
    // Pas de coercion implicite : seul un vrai booléen est accepté.
    expect(reservationCreate.safeParse({ items: [item], apply_employee_discount: '1' }).success).toBe(false)
    expect(reservationCreate.safeParse({ items: [item], apply_employee_discount: 1 }).success).toBe(false)
  })
})
