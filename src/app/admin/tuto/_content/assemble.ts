import type { TutoSection } from './types'

/**
 * Ordre pédagogique des sections du guide : navigation et concepts d'abord,
 * puis les écrans dans l'ordre de la sidebar admin. Les ids sont stables
 * entre les trois locales (ancres d'URL partagées).
 */
export const SECTION_ORDER = [
  'chrome',
  'concepts',
  'dashboard',
  'contabilidad',
  'products',
  'brands',
  'stock',
  'tags',
  'promotions',
  'reservations',
  'ventas',
  'messages',
  'home',
  'blog',
  'users',
  'reviews',
  'newsletter',
  'settings',
  'appearance',
  'admins',
  'logs',
] as const

/** Aplati les groupes de sections et les remet dans l'ordre canonique. */
export function orderSections(groups: TutoSection[][]): TutoSection[] {
  const byId = new Map<string, TutoSection>()
  for (const group of groups) {
    for (const section of group) byId.set(section.id, section)
  }
  return SECTION_ORDER.flatMap((id) => {
    const section = byId.get(id)
    return section ? [section] : []
  })
}
