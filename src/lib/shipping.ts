/**
 * ⚠️ LEGACY VOLONTAIRE (Phase 9, audit 2026-06-10) — FARMAU est CLICK & COLLECT
 * UNIQUEMENT : le tunnel ne propose plus de zones payantes (remédiation P2,
 * 2026-06-06) et ces tarifs ne sont plus jamais facturés. Ce module est
 * conservé parce que d'anciennes réservations `kind:'delivery'` peuvent encore
 * référencer ses libellés à l'AFFICHAGE (historique). Ne PAS re-exposer ces
 * tarifs dans le tunnel (mémoire click-and-collect-only) ; suppression
 * possible quand plus aucune réservation historique n'y fait appel.
 *
 * Tarifs et zones d'expédition FARMAU (République Dominicaine).
 *
 * - Santo Domingo (DN + Gran Santo Domingo)   : 300 DOP · 24-48h
 * - Interior del país                          : 600 DOP · 3-5 jours
 * - Retiro en farmacia                         : Gratuit · sur place
 *
 * Le code postal sert de proxy pour la zone : la plage 10000–11999
 * couvre Distrito Nacional + Gran Santo Domingo. Tout le reste est
 * considéré "interior".
 */

export type ShippingZone = 'santo_domingo' | 'interior' | 'pickup'

export type PickupLocation = {
  id: string
  name: string
  address: string
  hours: string
  phone: string
}

export const SHIPPING_COSTS: Record<ShippingZone, number> = {
  santo_domingo: 300,
  interior: 600,
  pickup: 0,
}

/**
 * FARMAU n'opère qu'une seule pharmacie, à Cerros de Gurabo (Santiago).
 * Les vraies coordonnées sont éditables via `shop_settings` (admin) — cette
 * constante reste le fallback statique pour les composants client qui ne
 * passent pas encore par SSR.
 */
export const PICKUP_LOCATION: PickupLocation = {
  id: 'santiago',
  name: 'Farmacia FARMAU Cerros de Gurabo',
  address: 'Calle Jesús de Galíndez Esq. Calle 3, Cerros de Gurabo · Santiago',
  hours: 'Lun-Vie 6h30-17h · Sáb 8h-16h',
  phone: '+1 809 724 3940',
}

/**
 * Détermine la zone à partir du code postal (5 chiffres). Renvoie
 * `interior` par défaut pour ne jamais bloquer un achat valide.
 */
export function zoneFromPostalCode(code: string): Exclude<ShippingZone, 'pickup'> {
  const digits = code.replace(/\D/g, '')
  if (digits.length === 5) {
    const n = Number(digits)
    if (n >= 10000 && n <= 11999) return 'santo_domingo'
  }
  return 'interior'
}

export function shippingCostFor(zone: ShippingZone): number {
  return SHIPPING_COSTS[zone]
}

export function getPickupLocation(): PickupLocation {
  return PICKUP_LOCATION
}
