import { formatPrice } from '@/lib/formatPrice'

/**
 * Builder PUR du reçu (comprobante de retiro) — NON FISCAL.
 *
 * FARMAU n'émet pas de comprobante fiscal (NCF/e-CF) aujourd'hui : ce document
 * est un reçu de retrait/vente, sans valeur fiscale (pas de RNC vendeur, pas de
 * NCF, pas de ventilation ITBIS). Voir la mémoire `rd-fiscal-ncf-ecf-itbis`.
 *
 * Fonction PURE (entrées → string HTML autonome) : aucun accès DB/Resend. La
 * route résout `getShopSettings()` et passe le vendeur déjà mappé. Le HTML est
 * stylé INLINE (CSP `style-src 'self' 'unsafe-inline'`) + `@media print` pour
 * l'impression / « Enregistrer en PDF » du navigateur — zéro dépendance PDF.
 *
 * ⚠️ Ne JAMAIS y passer de coût (unit_cost/cost_price) : document client.
 */

type InvoiceLocale = 'fr' | 'es' | 'en'

export type InvoiceItem = {
  name: string
  unitPrice: number
  quantity: number
}

export type InvoiceVendor = {
  name: string
  tagline?: string | null
  address?: string | null
  hours?: string | null
  phone?: string | null
  email?: string | null
}

export type InvoiceParams = {
  reference: string
  /** ISO (collected_at, repli created_at). */
  date: string
  locale?: string | null
  customerName?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  items: InvoiceItem[]
  total: number
  currency: string
  vendor: InvoiceVendor
}

function normalizeLocale(locale: string | null | undefined): InvoiceLocale {
  return locale === 'es' || locale === 'en' ? locale : 'fr'
}

/** Échappe le contenu dynamique (noms produits, nom client) injecté dans le HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const COPY: Record<
  InvoiceLocale,
  {
    docTitle: string
    receiptLabel: string
    nonFiscalNotice: string
    refLabel: string
    dateLabel: string
    customerLabel: string
    anonymousCustomer: string
    productsLabel: string
    qtyLabel: string
    unitLabel: string
    lineTotalLabel: string
    totalLabel: string
    pickupLabel: string
    printButton: string
    footer: string
  }
> = {
  fr: {
    docTitle: 'Reçu',
    receiptLabel: 'Reçu de retrait',
    nonFiscalNotice: 'Document non fiscal — ne tient pas lieu de facture fiscale (NCF).',
    refLabel: 'Référence',
    dateLabel: 'Date',
    customerLabel: 'Client',
    anonymousCustomer: 'Client de comptoir',
    productsLabel: 'Produits',
    qtyLabel: 'Qté',
    unitLabel: 'Prix unité',
    lineTotalLabel: 'Total',
    totalLabel: 'Total',
    pickupLabel: 'Point de retrait',
    printButton: 'Imprimer / Enregistrer en PDF',
    footer: 'FARMAU · Dermo-cosmétique conseillée',
  },
  es: {
    docTitle: 'Recibo',
    receiptLabel: 'Recibo de retiro',
    nonFiscalNotice: 'Documento no fiscal — no sustituye una factura con NCF.',
    refLabel: 'Referencia',
    dateLabel: 'Fecha',
    customerLabel: 'Cliente',
    anonymousCustomer: 'Cliente de mostrador',
    productsLabel: 'Productos',
    qtyLabel: 'Cant.',
    unitLabel: 'Precio unidad',
    lineTotalLabel: 'Total',
    totalLabel: 'Total',
    pickupLabel: 'Punto de retiro',
    printButton: 'Imprimir / Guardar como PDF',
    footer: 'FARMAU · Dermocosmética aconsejada',
  },
  en: {
    docTitle: 'Receipt',
    receiptLabel: 'Pickup receipt',
    nonFiscalNotice: 'Non-fiscal document — not a tax invoice (NCF).',
    refLabel: 'Reference',
    dateLabel: 'Date',
    customerLabel: 'Customer',
    anonymousCustomer: 'Counter customer',
    productsLabel: 'Products',
    qtyLabel: 'Qty',
    unitLabel: 'Unit price',
    lineTotalLabel: 'Total',
    totalLabel: 'Total',
    pickupLabel: 'Pickup point',
    printButton: 'Print / Save as PDF',
    footer: 'FARMAU · Recommended dermo-cosmetics',
  },
}

export function buildInvoiceHtml(params: InvoiceParams): string {
  const locale = normalizeLocale(params.locale)
  const t = COPY[locale]
  const cur = params.currency || 'DOP'
  const fmt = (n: number) => `${formatPrice(n, { locale, fractionDigits: 2 })} ${cur}`

  const dateStr = (() => {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(
        new Date(params.date),
      )
    } catch {
      return params.date
    }
  })()

  const customer =
    params.customerName?.trim() ||
    [params.customerPhone, params.customerEmail].filter(Boolean).join(' · ') ||
    t.anonymousCustomer

  const rows = params.items
    .map(
      (it) => `
        <tr>
          <td class="prod">${escapeHtml(it.name)}</td>
          <td class="num">${it.quantity}</td>
          <td class="num">${fmt(it.unitPrice)}</td>
          <td class="num">${fmt(it.unitPrice * it.quantity)}</td>
        </tr>`,
    )
    .join('')

  const vendorContact = [params.vendor.phone, params.vendor.email]
    .filter(Boolean)
    .map((v) => escapeHtml(String(v)))
    .join(' · ')

  const pickupBlock =
    params.vendor.address || params.vendor.hours
      ? `
      <div class="pickup">
        <div class="pickup-label">${t.pickupLabel}</div>
        ${params.vendor.address ? `<div>${escapeHtml(params.vendor.address)}</div>` : ''}
        ${params.vendor.hours ? `<div class="muted">${escapeHtml(params.vendor.hours)}</div>` : ''}
      </div>`
      : ''

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(t.docTitle)} ${escapeHtml(params.reference)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #2A2118; max-width: 620px; margin: 0 auto; padding: 40px 28px; background: #fff; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 2px solid #2A2118; padding-bottom: 16px; }
    .brand { font-size: 26px; font-weight: bold; letter-spacing: .02em; }
    .tagline { font-size: 12px; color: #6B5B4F; margin-top: 2px; }
    .vendor-contact { font-size: 11px; color: #6B5B4F; margin-top: 6px; }
    .doc { text-align: right; }
    .doc-kind { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #6B5B4F; }
    .doc-ref { font-size: 20px; font-weight: bold; margin-top: 4px; letter-spacing: .02em; }
    .meta { display: flex; gap: 32px; margin: 22px 0; flex-wrap: wrap; }
    .meta div { font-size: 13px; }
    .meta .label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #8A7A6C; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #8A7A6C; text-align: left; border-bottom: 1px solid #DDD; padding: 6px 0; }
    th.num, td.num { text-align: right; white-space: nowrap; }
    td { font-size: 14px; padding: 9px 0; border-bottom: 1px solid #EEE; }
    td.prod { padding-right: 12px; }
    .total-row td { font-weight: bold; font-size: 16px; border-bottom: none; border-top: 2px solid #2A2118; padding-top: 12px; }
    .pickup { margin-top: 24px; padding: 14px 16px; background: #F7F4F0; border-radius: 8px; font-size: 13px; }
    .pickup-label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #6B5B4F; margin-bottom: 4px; }
    .muted { color: #6B5B4F; }
    .notice { margin-top: 20px; font-size: 11px; color: #8A7A6C; font-style: italic; }
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #EEE; font-size: 11px; color: #AAA; }
    .actions { margin-top: 28px; }
    .print-btn { font-family: inherit; font-size: 13px; padding: 10px 20px; background: #2A2118; color: #fff; border: none; border-radius: 8px; cursor: pointer; }
    @media print { .actions { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="top">
    <div>
      <div class="brand">${escapeHtml(params.vendor.name)}</div>
      ${params.vendor.tagline ? `<div class="tagline">${escapeHtml(params.vendor.tagline)}</div>` : ''}
      ${vendorContact ? `<div class="vendor-contact">${vendorContact}</div>` : ''}
    </div>
    <div class="doc">
      <div class="doc-kind">${t.receiptLabel}</div>
      <div class="doc-ref">${escapeHtml(params.reference)}</div>
    </div>
  </div>

  <div class="meta">
    <div>
      <div class="label">${t.dateLabel}</div>
      <div>${escapeHtml(dateStr)}</div>
    </div>
    <div>
      <div class="label">${t.customerLabel}</div>
      <div>${escapeHtml(customer)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${t.productsLabel}</th>
        <th class="num">${t.qtyLabel}</th>
        <th class="num">${t.unitLabel}</th>
        <th class="num">${t.lineTotalLabel}</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="3">${t.totalLabel}</td>
        <td class="num">${fmt(params.total)}</td>
      </tr>
    </tbody>
  </table>

  ${pickupBlock}

  <p class="notice">${t.nonFiscalNotice}</p>

  <div class="actions">
    <button type="button" class="print-btn" onclick="window.print()">${t.printButton}</button>
  </div>

  <div class="footer">${t.footer}</div>
</body>
</html>`
}
