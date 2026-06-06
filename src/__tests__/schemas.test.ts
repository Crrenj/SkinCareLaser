import { describe, expect, it } from 'vitest'
import { productCreate, productUpdate, cartItemBody } from '@/lib/schemas'

/**
 * Garde-fous de validation côté API. Couvre :
 *  - C-09 : mass-assignment fermé (les clés hors-schéma sont retirées par Zod,
 *    donc `parsed.data` ne peut pas porter is_active/id/old_price/… injectés).
 *  - C-13 / C-28 : cap quantité panier 1..99.
 */
describe('productCreate (mass-assignment — C-09)', () => {
  const valid = { name: 'Crème', slug: 'creme', price: 100, stock: 5 }

  it('accepte une charge légitime', () => {
    const r = productCreate.safeParse(valid)
    expect(r.success).toBe(true)
  })

  it('retire les clés hors-schéma (is_active, is_featured, old_price, currency, id, created_at)', () => {
    const r = productCreate.safeParse({
      ...valid,
      is_active: true,
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
    expect(r.data).not.toHaveProperty('is_featured')
    expect(r.data).not.toHaveProperty('old_price')
    expect(r.data).not.toHaveProperty('currency')
    expect(r.data).not.toHaveProperty('id')
    expect(r.data).not.toHaveProperty('created_at')
    expect(Object.keys(r.data).sort()).toEqual(['name', 'price', 'slug', 'stock'])
  })

  it('rejette les champs requis manquants ou invalides', () => {
    expect(productCreate.safeParse({ slug: 'x', price: 1, stock: 1 }).success).toBe(false) // name
    expect(productCreate.safeParse({ name: 'x', price: 1, stock: 1 }).success).toBe(false) // slug
    expect(productCreate.safeParse({ name: 'x', slug: '', price: 1, stock: 1 }).success).toBe(false) // slug vide
    expect(productCreate.safeParse({ ...valid, price: -1 }).success).toBe(false) // prix négatif
    expect(productCreate.safeParse({ ...valid, stock: 1.5 }).success).toBe(false) // stock non-entier
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
