import 'server-only'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { logger } from '@/lib/logger'
import { formatPrice } from '@/lib/formatPrice'
import { buildReservationReference } from '@/lib/reservation'
import { buildReservationWhatsappLink, type ReservationPayload } from '@/lib/whatsapp'
import { getShopSettings } from '@/lib/getShopSettings'

/**
 * Email de confirmation de réservation — la seule trace durable du flux
 * (la coordination WhatsApp reste manuelle ; cet email = preuve + rappel).
 *
 * No-op propre si `RESEND_API_KEY` est absent (`resend` null), exactement
 * comme l'email double opt-in de la newsletter. Best-effort absolu : ne throw
 * jamais — l'appelant l'enveloppe en plus dans `after()` + try/catch.
 *
 * Contenu localisé fr/es/en en dur (cohérent avec l'email newsletter, hors
 * système next-intl : un email n'a pas de contexte de requête i18n).
 */

type EmailLocale = 'fr' | 'es' | 'en'

export type ReservationEmailItem = {
  name: string
  brand?: string | null
  unitPrice: number
  quantity: number
}

export type SendReservationConfirmationParams = {
  to: string
  reservationId: string
  /** created_at de la réservation (pour la référence FAR-YYYYMMDD-XXXX). */
  createdAt?: string | null
  /** Locale d'envoi déjà résolue par l'appelant (profil > body > 'fr'). */
  locale?: string | null
  contactName?: string | null
  contactPhone?: string | null
  items: ReservationEmailItem[]
  /** total_price (= sous-total, click & collect uniquement). */
  total: number
}

function normalizeLocale(locale: string | null | undefined): EmailLocale {
  return locale === 'es' || locale === 'en' ? locale : 'fr'
}

/** Échappe le contenu BDD (noms produits) injecté dans le HTML de l'email. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const COPY: Record<
  EmailLocale,
  {
    subject: (ref: string) => string
    preheaderTitle: string
    intro: string
    refLabel: string
    productsLabel: string
    qtyTimes: string
    totalLabel: string
    pickupLabel: string
    hoursLabel: string
    ttl: string
    whatsappIntro: string
    whatsappCta: string
    footer: string
  }
> = {
  fr: {
    subject: (ref) => `Votre réservation ${ref} · FARMAU`,
    preheaderTitle: 'Réservation confirmée',
    intro: 'Merci ! Votre réservation est bien enregistrée. Voici son récapitulatif.',
    refLabel: 'Référence',
    productsLabel: 'Produits',
    qtyTimes: '×',
    totalLabel: 'Total à régler en pharmacie',
    pickupLabel: 'Retrait en pharmacie',
    hoursLabel: 'Horaires',
    ttl: 'Votre réservation est gardée pendant 24 h. Passez la récupérer avant expiration.',
    whatsappIntro: 'Confirmez votre passage et coordonnez le retrait par WhatsApp :',
    whatsappCta: 'Coordonner sur WhatsApp',
    footer: 'FARMAU · Dermo-cosmétique conseillée',
  },
  es: {
    subject: (ref) => `Tu reserva ${ref} · FARMAU`,
    preheaderTitle: 'Reserva confirmada',
    intro: '¡Gracias! Tu reserva quedó registrada. Aquí tienes el resumen.',
    refLabel: 'Referencia',
    productsLabel: 'Productos',
    qtyTimes: '×',
    totalLabel: 'Total a pagar en la farmacia',
    pickupLabel: 'Retiro en la farmacia',
    hoursLabel: 'Horario',
    ttl: 'Tu reserva se guarda durante 24 h. Pásate a recogerla antes de que expire.',
    whatsappIntro: 'Confirma tu visita y coordina el retiro por WhatsApp:',
    whatsappCta: 'Coordinar por WhatsApp',
    footer: 'FARMAU · Dermocosmética aconsejada',
  },
  en: {
    subject: (ref) => `Your reservation ${ref} · FARMAU`,
    preheaderTitle: 'Reservation confirmed',
    intro: 'Thank you! Your reservation is saved. Here is the summary.',
    refLabel: 'Reference',
    productsLabel: 'Products',
    qtyTimes: '×',
    totalLabel: 'Total to pay at the pharmacy',
    pickupLabel: 'Pharmacy pickup',
    hoursLabel: 'Hours',
    ttl: 'Your reservation is held for 24 h. Come pick it up before it expires.',
    whatsappIntro: 'Confirm your visit and coordinate pickup over WhatsApp:',
    whatsappCta: 'Coordinate on WhatsApp',
    footer: 'FARMAU · Recommended dermo-cosmetics',
  },
}

/**
 * Envoie l'email de confirmation. Retourne `false` (no-op) si Resend n'est pas
 * configuré ou si l'envoi échoue ; `true` si l'email part. Ne throw jamais.
 */
export async function sendReservationConfirmationEmail(
  params: SendReservationConfirmationParams,
): Promise<boolean> {
  if (!resend) return false // Pas de RESEND_API_KEY → no-op silencieux (comme la newsletter).
  if (!params.to) return false

  const locale = normalizeLocale(params.locale)
  const t = COPY[locale]
  const localeTag = locale // formatPrice mappe fr/es/en → tag BCP-47
  const reference = buildReservationReference(params.reservationId, params.createdAt)
  const shop = await getShopSettings()

  // Lien WhatsApp pré-rempli : on réutilise le helper partagé (même message que
  // la page de confirmation). Le nom est éclaté en prénom/nom au mieux.
  const nameParts = (params.contactName ?? '').trim().split(/\s+/).filter(Boolean)
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ')
  const waPayload: ReservationPayload = {
    reference,
    contact: {
      firstName,
      lastName,
      phone: params.contactPhone ?? '',
      email: params.to,
    },
    shipping: {
      kind: 'pickup',
      pickup: {
        id: 'pharmacy',
        name: shop.pickup_name ?? 'FARMAU',
        address: shop.pickup_address ?? '',
        hours: shop.pickup_hours ?? '',
        phone: shop.pickup_phone ?? '',
      },
    },
    items: params.items.map((it) => ({
      name: it.name,
      brand: it.brand ?? null,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
    })),
    subtotal: params.total,
  }
  const whatsappLink = buildReservationWhatsappLink(waPayload, shop.whatsapp_number)
  const isWhatsapp = whatsappLink.startsWith('https://wa.me/')

  const fmt = (n: number) => formatPrice(n, { locale: localeTag })

  const itemsRows = params.items
    .map((it) => {
      const brand = it.brand ? `${escapeHtml(it.brand)} · ` : ''
      const lineTotal = fmt(it.unitPrice * it.quantity)
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;">
            ${it.quantity} ${t.qtyTimes} ${brand}${escapeHtml(it.name)}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;white-space:nowrap;">
            ${lineTotal} DOP
          </td>
        </tr>`
    })
    .join('')

  const pickupBlock =
    shop.pickup_name || shop.pickup_address || shop.pickup_hours
      ? `
        <div style="margin-top:24px;padding:16px;background:#F7F4F0;border-radius:8px;">
          <p style="margin:0 0 6px;font-size:13px;color:#6B5B4F;text-transform:uppercase;letter-spacing:.04em;">
            ${t.pickupLabel}
          </p>
          ${shop.pickup_name ? `<p style="margin:0;font-size:15px;color:#222;font-weight:bold;">${escapeHtml(shop.pickup_name)}</p>` : ''}
          ${shop.pickup_address ? `<p style="margin:4px 0 0;font-size:14px;color:#444;">${escapeHtml(shop.pickup_address)}</p>` : ''}
          ${shop.pickup_hours ? `<p style="margin:8px 0 0;font-size:13px;color:#666;">${t.hoursLabel} : ${escapeHtml(shop.pickup_hours)}</p>` : ''}
        </div>`
      : ''

  const whatsappBlock = isWhatsapp
    ? `
        <div style="margin-top:24px;">
          <p style="font-size:14px;line-height:1.6;color:#333;margin:0 0 12px;">${t.whatsappIntro}</p>
          <a href="${whatsappLink}"
             style="display:inline-block;padding:12px 24px;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:bold;">
            ${t.whatsappCta}
          </a>
        </div>`
    : ''

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 20px;">
      <h1 style="font-size:24px;margin:0 0 4px;color:#222;">FARMAU</h1>
      <p style="font-size:13px;color:#6B5B4F;margin:0 0 24px;text-transform:uppercase;letter-spacing:.06em;">
        ${t.preheaderTitle}
      </p>
      <p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px;">${t.intro}</p>

      <p style="font-size:14px;color:#666;margin:0 0 4px;">${t.refLabel}</p>
      <p style="font-size:20px;color:#222;margin:0 0 24px;font-weight:bold;letter-spacing:.02em;">${reference}</p>

      <p style="font-size:13px;color:#6B5B4F;text-transform:uppercase;letter-spacing:.04em;margin:0 0 8px;">
        ${t.productsLabel}
      </p>
      <table style="width:100%;border-collapse:collapse;">
        ${itemsRows}
        <tr>
          <td style="padding:14px 0 0;font-size:15px;color:#222;font-weight:bold;">${t.totalLabel}</td>
          <td style="padding:14px 0 0;font-size:15px;color:#222;font-weight:bold;text-align:right;white-space:nowrap;">${fmt(params.total)} DOP</td>
        </tr>
      </table>

      ${pickupBlock}

      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#888;">${t.ttl}</p>

      ${whatsappBlock}

      <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px;" />
      <p style="font-size:12px;color:#aaa;margin:0;">${t.footer}</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: t.subject(reference),
      html,
    })
    return true
  } catch (err) {
    logger.error('[reservationEmail] resend error:', err)
    return false
  }
}
