import { describe, it, expect } from 'vitest'
import { safeRedirectPath, safeRedirectOr } from '@/lib/safeRedirect'

describe('safeRedirectPath', () => {
  it('accepte les chemins internes (localisés, admin, query)', () => {
    expect(safeRedirectPath('/')).toBe('/')
    expect(safeRedirectPath('/fr/account')).toBe('/fr/account')
    expect(safeRedirectPath('/admin/products')).toBe('/admin/products')
    expect(safeRedirectPath('/es/catalogue?brand=avene')).toBe('/es/catalogue?brand=avene')
  })

  it('rejette les cibles externes / protocol-relative / backslash', () => {
    expect(safeRedirectPath('//evil.com')).toBeNull()
    expect(safeRedirectPath('https://evil.com')).toBeNull()
    expect(safeRedirectPath('http://evil.com')).toBeNull()
    expect(safeRedirectPath('/\\evil.com')).toBeNull()
  })

  it('rejette les schémas dangereux', () => {
    expect(safeRedirectPath('javascript:alert(1)')).toBeNull()
    expect(safeRedirectPath('data:text/html,<script>')).toBeNull()
    expect(safeRedirectPath('mailto:x@y.z')).toBeNull()
  })

  it('rejette le traversal et les slashs encodés', () => {
    expect(safeRedirectPath('/../etc')).toBeNull()
    expect(safeRedirectPath('/%2f%2fevil.com')).toBeNull()
    expect(safeRedirectPath('/%2e%2e/secret')).toBeNull()
    expect(safeRedirectPath('/%5cevil')).toBeNull()
  })

  it('rejette les entrées vides / relatives / non-string', () => {
    expect(safeRedirectPath('')).toBeNull()
    expect(safeRedirectPath(null)).toBeNull()
    expect(safeRedirectPath(undefined)).toBeNull()
    expect(safeRedirectPath('relative/path')).toBeNull()
  })
})

describe('safeRedirectOr', () => {
  it('retourne la cible sûre, sinon le fallback validé, sinon "/"', () => {
    expect(safeRedirectOr('/fr/account', '/')).toBe('/fr/account')
    expect(safeRedirectOr('//evil.com', '/fr')).toBe('/fr')
    expect(safeRedirectOr('//evil.com', '//also-evil')).toBe('/')
  })
})
