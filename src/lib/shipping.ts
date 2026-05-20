/**
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
 * Liste statique des points de retrait en attendant la table
 * `pickup_locations` côté DB. Quand la table existe, remplacer cette
 * source par une query Supabase.
 */
export const PICKUP_LOCATIONS: readonly PickupLocation[] = [
  {
    id: 'naco',
    name: 'Farmacia FARMAU Naco',
    address: 'Av. Tiradentes 32 · Santo Domingo',
    hours: 'Lun-Sáb 8h-20h · Dom 9h-14h',
    phone: '+1 809 111 2233',
  },
  {
    id: 'piantini',
    name: 'Farmacia FARMAU Piantini',
    address: 'Av. Winston Churchill 1099 · Santo Domingo',
    hours: 'Lun-Sáb 8h-21h',
    phone: '+1 809 111 2244',
  },
  {
    id: 'santiago',
    name: 'Farmacia FARMAU Santiago',
    address: 'Calle del Sol 45 · Santiago de los Caballeros',
    hours: 'Lun-Vie 9h-19h · Sáb 9h-15h',
    phone: '+1 809 222 3344',
  },
] as const

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

export function getPickupLocation(id: string): PickupLocation | undefined {
  return PICKUP_LOCATIONS.find((p) => p.id === id)
}
