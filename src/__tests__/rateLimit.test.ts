import { describe, it, expect, vi } from 'vitest'

// supabaseAdmin forcé à `null` → la branche de panne de checkRateLimit
// (onFailure) est exercée de façon déterministe, sans RPC ni DB. On teste
// ainsi le contrat fail-open (défaut) vs fail-closed (opt-in).
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: null }))

import { getClientIp, checkRateLimit } from '@/lib/rateLimit'

function req(headers: Record<string, string>): Request {
  return new Request('https://farmau.do/api/x', { headers })
}

describe('getClientIp', () => {
  it('priorise x-vercel-forwarded-for (1er hop, posé par l\'edge Vercel)', () => {
    const ip = getClientIp(
      req({ 'x-vercel-forwarded-for': '203.0.113.7, 10.0.0.1', 'x-forwarded-for': '1.2.3.4' }),
    )
    expect(ip).toBe('203.0.113.7')
  })

  it('ne prend JAMAIS le 1er hop (spoofable) de x-forwarded-for', () => {
    const ip = getClientIp(req({ 'x-forwarded-for': '6.6.6.6, 203.0.113.7' }))
    expect(ip).not.toBe('6.6.6.6')
    expect(ip).toBe('203.0.113.7') // dernier hop = proxy de confiance
  })

  it('retombe sur x-real-ip puis "unknown"', () => {
    expect(getClientIp(req({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2')
    expect(getClientIp(req({}))).toBe('unknown')
  })
})

describe('checkRateLimit — politique de panne (supabaseAdmin null)', () => {
  it('fail-open par défaut : laisse passer sur panne (comportement historique)', async () => {
    const r = await checkRateLimit('test:open', 5, 60)
    expect(r.allowed).toBe(true)
    expect(r.retryAfter).toBe(0)
  })

  it('fail-open explicite : laisse passer', async () => {
    const r = await checkRateLimit('test:open2', 5, 60, { failClosed: false })
    expect(r.allowed).toBe(true)
    expect(r.retryAfter).toBe(0)
  })

  it('fail-closed opt-in : refuse avec un retryAfter raisonnable', async () => {
    const r = await checkRateLimit('test:closed', 5, 60, { failClosed: true })
    expect(r.allowed).toBe(false)
    expect(r.retryAfter).toBeGreaterThan(0)
  })
})
