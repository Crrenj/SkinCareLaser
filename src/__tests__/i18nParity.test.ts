import { describe, expect, it } from 'vitest'
import fr from '@/messages/fr.json'
import es from '@/messages/es.json'
import en from '@/messages/en.json'

/**
 * Parité des fichiers de messages : fr/es/en DOIVENT exposer exactement le même
 * ensemble de clés (feuilles). Une clé manquante dans une locale ne casse
 * next-intl qu'au RUNTIME sur l'écran concerné — ce test transforme cette
 * discipline manuelle en gate CI (test:unit). Ajouté avec les features
 * facture/promo employé (2026-06-18) qui touchaient 4 namespaces.
 */

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const out: string[] = []
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out.push(...flattenKeys(v, prefix ? `${prefix}.${k}` : k))
    }
    return out
  }
  return [prefix]
}

describe('i18n parité fr/es/en', () => {
  const frKeys = flattenKeys(fr).sort()
  const esKeys = flattenKeys(es).sort()
  const enKeys = flattenKeys(en).sort()

  it('es expose exactement les mêmes clés que fr', () => {
    expect(esKeys).toEqual(frKeys)
  })

  it('en expose exactement les mêmes clés que fr', () => {
    expect(enKeys).toEqual(frKeys)
  })
})
