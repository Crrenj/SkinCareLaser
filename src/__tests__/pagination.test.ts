import { describe, expect, it } from 'vitest'
import { buildPageRange } from '@/lib/pagination'

describe('buildPageRange', () => {
  it('liste plate sans ellipse quand total ≤ 7', () => {
    expect(buildPageRange(1, 1)).toEqual([1])
    expect(buildPageRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('total ≤ 0 → vide', () => {
    expect(buildPageRange(1, 0)).toEqual([])
  })

  it('fenêtre au début : ellipse à droite seulement', () => {
    expect(buildPageRange(1, 36)).toEqual([1, 2, 'ellipsis', 36])
    expect(buildPageRange(2, 36)).toEqual([1, 2, 3, 'ellipsis', 36])
  })

  it('fenêtre au milieu : ellipses des deux côtés', () => {
    expect(buildPageRange(5, 36)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 36])
  })

  it("une ellipse ne masque jamais une seule page (on l'affiche)", () => {
    // gap d'exactement une page entre la fenêtre et la borne → page affichée
    expect(buildPageRange(4, 36)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 36])
    expect(buildPageRange(33, 36)).toEqual([1, 'ellipsis', 32, 33, 34, 35, 36])
  })

  it('régression : pas de doublon sur les dernières pages (ancien bug catalogue)', () => {
    // L'ancienne implémentation produisait [1, …, 35, 35, 36] (clé React dupliquée)
    expect(buildPageRange(36, 36)).toEqual([1, 'ellipsis', 35, 36])
    expect(buildPageRange(35, 36)).toEqual([1, 'ellipsis', 34, 35, 36])
    expect(buildPageRange(34, 36)).toEqual([1, 'ellipsis', 33, 34, 35, 36])
  })

  it('propriétés invariantes pour tout (current, total) raisonnable', () => {
    for (let total = 1; total <= 40; total++) {
      for (let current = 1; current <= total; current++) {
        const range = buildPageRange(current, total)
        const nums = range.filter((e): e is number => typeof e === 'number')
        // pas de doublon
        expect(new Set(nums).size).toBe(nums.length)
        // strictement croissant
        expect([...nums].sort((a, b) => a - b)).toEqual(nums)
        // bornes + page courante toujours présentes
        expect(nums[0]).toBe(1)
        expect(nums[nums.length - 1]).toBe(total)
        expect(nums).toContain(current)
        // jamais deux ellipses adjacentes
        range.forEach((e, i) => {
          if (e === 'ellipsis') expect(range[i + 1]).not.toBe('ellipsis')
        })
      }
    }
  })
})
