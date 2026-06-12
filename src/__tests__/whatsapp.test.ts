import { describe, expect, it } from 'vitest'
import { buildRestockMessage, buildRestockWhatsappLink } from '@/lib/whatsapp'

describe('buildRestockWhatsappLink', () => {
  it('construit un lien wa.me avec le numéro nettoyé (chiffres seuls)', () => {
    const link = buildRestockWhatsappLink('Avène Hyaluron B3', '+1 809 724 3940')
    expect(link.startsWith('https://wa.me/18097243940?text=')).toBe(true)
  })

  it('encode le nom du produit dans le message pré-rempli', () => {
    const link = buildRestockWhatsappLink('Crème solaire 50+', '+18094122468')
    const text = decodeURIComponent(link.split('?text=')[1])
    expect(text).toContain('Crème solaire 50+')
    expect(text).toContain('agotado')
    expect(text).toContain('disponible de nuevo')
  })

  it('retombe sur /contact sans numéro configuré', () => {
    expect(buildRestockWhatsappLink('Produit X', null)).toBe('/contact')
    expect(buildRestockWhatsappLink('Produit X', undefined)).toBe('/contact')
    expect(buildRestockWhatsappLink('Produit X', '   ')).toBe('/contact')
  })

  it('le message est en espagnol (langue de coordination, comme la réservation)', () => {
    expect(buildRestockMessage('X')).toMatch(/^Hola FARMAU/)
  })
})
