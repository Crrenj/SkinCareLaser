import {
  PICKUP_LOCATIONS,
  SHIPPING_COSTS,
  type PickupLocation,
  type ShippingZone,
} from '@/lib/shipping'
import { formatPrice } from '@/lib/formatPrice'

export type ReservationContact = {
  firstName: string
  lastName: string
  phone: string
  email?: string
}

export type ReservationAddress = {
  street: string
  city: string
  postalCode: string
}

export type ReservationItemSnapshot = {
  name: string
  brand?: string | null
  unitPrice: number
  quantity: number
}

export type ReservationPayload = {
  reference: string
  contact: ReservationContact
  shipping:
    | { kind: 'delivery'; zone: Exclude<ShippingZone, 'pickup'>; address: ReservationAddress }
    | { kind: 'pickup'; pickup: PickupLocation }
  items: ReservationItemSnapshot[]
  subtotal: number
  customerNote?: string
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''

/**
 * Construit le message WhatsApp pré-rempli pour coordonner une réservation.
 * Spanish first — la coordination se fait en ES en RD.
 */
export function buildReservationMessage(p: ReservationPayload): string {
  const shippingLabel =
    p.shipping.kind === 'pickup'
      ? `Retiro en farmacia · ${p.shipping.pickup.name}`
      : p.shipping.zone === 'santo_domingo'
        ? 'Entrega Santo Domingo · 24-48h'
        : 'Entrega Interior · 3-5 días'
  const shippingCost =
    p.shipping.kind === 'pickup' ? 0 : SHIPPING_COSTS[p.shipping.zone]
  const total = p.subtotal + shippingCost
  const fmt = (n: number) => formatPrice(n)

  const lines: string[] = []
  lines.push(`Hola FARMAU 👋, quiero confirmar mi reserva *#${p.reference}*.`)
  lines.push('')
  lines.push(`*${p.contact.firstName} ${p.contact.lastName}* · ${p.contact.phone}`)
  if (p.shipping.kind === 'delivery') {
    lines.push(
      `Dirección: ${p.shipping.address.street}, ${p.shipping.address.city} ${p.shipping.address.postalCode}`,
    )
  }
  lines.push('')
  lines.push('*Productos:*')
  for (const it of p.items) {
    const brand = it.brand ? `[${it.brand}] ` : ''
    lines.push(`• ${it.quantity} × ${brand}${it.name} — ${fmt(it.unitPrice * it.quantity)} DOP`)
  }
  lines.push('')
  lines.push(`Subtotal: ${fmt(p.subtotal)} DOP`)
  lines.push(`Envío: ${shippingLabel}${shippingCost ? ` · ${fmt(shippingCost)} DOP` : ' · Gratis'}`)
  lines.push(`*Total a coordinar: ${fmt(total)} DOP*`)
  if (p.customerNote) {
    lines.push('')
    lines.push(`Nota: ${p.customerNote}`)
  }
  return lines.join('\n')
}

/**
 * Génère un lien wa.me préparé. Si NEXT_PUBLIC_WHATSAPP_NUMBER manque, on
 * renvoie un fallback sur la page contact pour ne jamais casser le flow.
 */
export function buildReservationWhatsappLink(p: ReservationPayload): string {
  const message = encodeURIComponent(buildReservationMessage(p))
  const digits = WHATSAPP_NUMBER.replace(/\D/g, '')
  if (!digits) return `/contact?ref=${encodeURIComponent(p.reference)}`
  return `https://wa.me/${digits}?text=${message}`
}

export function findPickupLocation(id: string): PickupLocation | undefined {
  return PICKUP_LOCATIONS.find((p) => p.id === id)
}
