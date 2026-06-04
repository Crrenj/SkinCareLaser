import { describe, it, expect } from 'vitest'
import { getClientIp } from '@/lib/rateLimit'

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
