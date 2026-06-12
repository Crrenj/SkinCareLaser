import {
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

/**
 * Construit le message WhatsApp pré-rempli pour coordonner une réservation.
 * Spanish first — la coordination se fait en ES en RD.
 *
 * Click & collect uniquement : pas de frais de livraison, le total annoncé
 * == le sous-total == `reservations.total_price` (cohérence client↔DB↔admin).
 */
export function buildReservationMessage(p: ReservationPayload): string {
  const fmt = (n: number) => formatPrice(n)

  const lines: string[] = []
  lines.push(`Hola FARMAU 👋, quiero confirmar mi reserva *#${p.reference}*.`)
  lines.push('')
  lines.push(`*${p.contact.firstName} ${p.contact.lastName}* · ${p.contact.phone}`)
  lines.push('')
  lines.push('*Productos:*')
  for (const it of p.items) {
    const brand = it.brand ? `[${it.brand}] ` : ''
    lines.push(`• ${it.quantity} × ${brand}${it.name} — ${fmt(it.unitPrice * it.quantity)} DOP`)
  }
  lines.push('')
  lines.push(`*Total a coordinar: ${fmt(p.subtotal)} DOP*`)
  lines.push(
    p.shipping.kind === 'pickup' && p.shipping.pickup.name
      ? `Retiro en farmacia · ${p.shipping.pickup.name}`
      : 'Retiro en farmacia',
  )
  if (p.customerNote) {
    lines.push('')
    lines.push(`Nota: ${p.customerNote}`)
  }
  return lines.join('\n')
}

/**
 * Génère un lien wa.me préparé à partir du numéro WhatsApp de la boutique
 * (`shop_settings.whatsapp_number`, threadé depuis le Server Component). Si le
 * numéro manque, on retombe sur la page contact pour ne jamais casser le flow.
 */
export function buildReservationWhatsappLink(
  p: ReservationPayload,
  whatsappNumber: string | null | undefined,
): string {
  const message = encodeURIComponent(buildReservationMessage(p))
  const digits = (whatsappNumber ?? '').replace(/\D/g, '')
  if (!digits) return `/contact?ref=${encodeURIComponent(p.reference)}`
  return `https://wa.me/${digits}?text=${message}`
}

/**
 * Message « réassort » d'un produit épuisé — Spanish first, même convention
 * que la coordination de réservation (le client demande quand le produit
 * sera réapprovisionné).
 */
export function buildRestockMessage(productName: string): string {
  return `Hola FARMAU 👋, el producto *${productName}* aparece agotado en la web. ¿Me pueden decir cuándo estará disponible de nuevo?`
}

/**
 * Lien wa.me pré-rempli pour demander le réassort d'un produit épuisé
 * (`shop_settings.whatsapp_number`, threadé depuis le Server Component).
 * Sans numéro configuré, on retombe sur la page contact.
 */
export function buildRestockWhatsappLink(
  productName: string,
  whatsappNumber: string | null | undefined,
): string {
  const digits = (whatsappNumber ?? '').replace(/\D/g, '')
  if (!digits) return '/contact'
  return `https://wa.me/${digits}?text=${encodeURIComponent(buildRestockMessage(productName))}`
}
