import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Prix effectif promo — source unique pour l'affichage discount-aware.
 *
 * `fetchEffectivePrices` lit la vue publique `v_product_pricing` en batch
 * (un seul `.in(ids)`, jamais per-row) : base_price + effective_price (calculé
 * par la fonction effective_price, qui n'expose jamais le coût). À utiliser sur
 * toutes les surfaces qui rendent un prix (catalogue, PDP, home, marques,
 * besoins, favoris, panier, recherche).
 *
 * `applyPromo` est la règle de swap unique : si une promo est active
 * (effective < base), on affiche le prix remisé et on barre `max(base, old_price
 * manuel)` — garantit `oldPrice > price` et un pourcentage honnête, cohérent
 * partout. Sans promo, le comportement manuel `old_price` est inchangé.
 */

export type EffectivePrice = { base: number; effective: number }

export async function fetchEffectivePrices(
  sb: SupabaseClient<Database>,
  ids: (string | null | undefined)[],
): Promise<Map<string, EffectivePrice>> {
  const map = new Map<string, EffectivePrice>()
  const unique = [...new Set(ids.filter((x): x is string => !!x))]
  if (unique.length === 0) return map
  const { data } = await sb
    .from('v_product_pricing')
    .select('product_id, base_price, effective_price')
    .in('product_id', unique)
  for (const r of data ?? []) {
    if (!r.product_id) continue
    const base = Number(r.base_price ?? 0)
    map.set(r.product_id, {
      base,
      effective: Number(r.effective_price ?? base),
    })
  }
  return map
}

export function applyPromo(
  basePrice: number,
  manualOldPrice: number | null | undefined,
  pricing: EffectivePrice | undefined,
): { price: number; oldPrice: number | undefined } {
  const base = pricing?.base ?? basePrice
  const eff = pricing?.effective ?? base
  if (eff < base) {
    // Promo active : barrer l'ancre la plus haute (base ou old_price manuel).
    return { price: eff, oldPrice: Math.max(base, manualOldPrice ?? 0) }
  }
  // Pas de promo : comportement manuel `old_price` inchangé.
  return { price: base, oldPrice: manualOldPrice ?? undefined }
}
