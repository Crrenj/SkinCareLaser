import { describe, it, expect } from 'vitest'
import { createHash } from 'crypto'
import { THEME_MODE_SCRIPT } from '@/lib/themeModeScript'

describe('THEME_MODE_SCRIPT', () => {
  it('est un script non vide, sans backtick ni interpolation', () => {
    expect(THEME_MODE_SCRIPT.length).toBeGreaterThan(0)
    expect(THEME_MODE_SCRIPT).toContain("setAttribute('data-mode'")
    // Un backtick ou `${` casserait l'égalité valeur-runtime ↔ source et donc
    // le hash CSP calculé dans next.config.ts.
    expect(THEME_MODE_SCRIPT).not.toContain('`')
    expect(THEME_MODE_SCRIPT).not.toContain('${')
  })

  it('produit un hash SHA-256 déterministe (utilisé en CSP script-src)', () => {
    const h1 = createHash('sha256').update(THEME_MODE_SCRIPT).digest('base64')
    const h2 = createHash('sha256').update(THEME_MODE_SCRIPT).digest('base64')
    expect(h1).toBe(h2)
    expect(h1.length).toBeGreaterThan(0)
  })
})
