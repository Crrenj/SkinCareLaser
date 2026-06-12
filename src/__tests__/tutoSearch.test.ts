import { describe, it, expect } from 'vitest'
import { deburr, countHits } from '@/app/admin/tuto/_components/tutoSearch'

describe('deburr', () => {
  it('minuscules + sans accents', () => {
    expect(deburr('Réservation')).toBe('reservation')
    expect(deburr('Comptabilité — DGII')).toBe('comptabilite — dgii')
    expect(deburr('Añadir')).toBe('anadir')
  })

  it('préserve la longueur UTF-16 (les offsets de surlignage en dépendent)', () => {
    const samples = [
      'Réservation établie à Santiago',
      'le client a ouvert WhatsApp 💬 depuis la légende',
      '💬 en tête',
      'mélange : é💬è 💬 ü',
      'Próximo año — ñandú',
    ]
    for (const s of samples) {
      expect(deburr(s)).toHaveLength(s.length)
    }
  })

  it('un match situé APRÈS un emoji astral garde des offsets exacts', () => {
    const t = 'marqueur 💬 (« le client a ouvert WhatsApp »)'
    const dt = deburr(t)
    const j = dt.indexOf(deburr('whatsapp'))
    expect(j).toBeGreaterThan(-1)
    expect(t.slice(j, j + 'whatsapp'.length)).toBe('WhatsApp')
  })
})

describe('countHits', () => {
  it('compte les occurrences non chevauchantes', () => {
    expect(countHits(deburr('stock, stock et re-stock'), deburr('stock'))).toBe(3)
    expect(countHits(deburr('aaaa'), 'aa')).toBe(2)
    expect(countHits(deburr('rien ici'), deburr('promo'))).toBe(0)
  })

  it('requête vide → 0', () => {
    expect(countHits(deburr('peu importe'), '')).toBe(0)
  })

  it('accent-insensible dans les deux sens', () => {
    expect(countHits(deburr('Comptabilité'), deburr('COMPTABILITÉ'))).toBe(1)
    expect(countHits(deburr('reservation'), deburr('réservation'))).toBe(1)
  })
})
