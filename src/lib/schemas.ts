import { z } from 'zod'
import { NextResponse } from 'next/server'
import { HOME_SECTION_KEYS } from '@/lib/homeSections'

export function parseBody<T>(schema: z.ZodType<T>, body: unknown):
  | { ok: true; data: T }
  | { ok: false; response: NextResponse } {
  const result = schema.safeParse(body)
  if (result.success) return { ok: true, data: result.data }
  const firstIssue = result.error.issues[0]
  return {
    ok: false,
    response: NextResponse.json(
      { error: firstIssue?.message ?? 'Validation error', issues: result.error.issues },
      { status: 400 },
    ),
  }
}

const VALID_BANNER_TYPES = [
  'editorial', 'hero', 'quote',
  'image_left', 'image_right', 'image_full',
  'card_style', 'minimal', 'gradient_overlay',
] as const

export const brandBody = z.object({
  name: z.string().min(1, 'name requis'),
  slug: z.string().min(1, 'slug requis'),
})

export const rangeBody = z.object({
  name: z.string().min(1, 'name requis'),
  slug: z.string().min(1, 'slug requis'),
  brand_id: z.string().uuid('brand_id invalide'),
})

export const tagBody = z.object({
  name: z.string().min(1, 'name requis'),
  slug: z.string().min(1, 'slug requis'),
  tag_type_id: z.string().uuid('tag_type_id requis'),
})

export const tagPatch = z.object({
  name: z.string().min(1, 'name requis'),
  slug: z.string().min(1, 'slug requis'),
})

export const tagTypeBody = z.object({
  name: z.string().min(1, 'name requis'),
  slug: z.string().min(1, 'slug requis'),
  icon: z.string().optional(),
  color: z.string().optional(),
  initial_tag: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
  }).optional(),
})

export const tagTypePatch = z.object({
  name: z.string().min(1, 'name requis'),
  slug: z.string().min(1, 'slug requis'),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export const stockBody = z.object({
  product_id: z.string().uuid('product_id requis'),
  stock: z.number().int().min(0, 'Le stock ne peut pas être négatif'),
})

// Entrée de stock (réception) : produit + quantité + prix d'achat, alimente le
// CMP (record_stock_entries). STRICT (pas de .passthrough()) — created_by est
// dérivé serveur (auth.userId), jamais du body. client_token = idempotence.
// Champs fiscaux (606) optionnels au niveau du lot (1 réception = 1 facture).
// Bornes alignées sur les gardes in-RPC. unit_cost .max() rejette Infinity/NaN.
export const stockEntryBody = z.object({
  client_token: z.string().uuid('client_token invalide'),
  supplier_name: z.string().trim().max(200).optional(),
  supplier_rnc: z.string().trim().max(20).optional(),
  ncf: z.string().trim().max(30).optional(),
  invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (AAAA-MM-JJ)').optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid('product_id invalide'),
        quantity: z.number().int().positive('Quantité invalide').max(1_000_000),
        unit_cost: z.number().nonnegative('Coût invalide').max(10_000_000),
        itbis_included: z.boolean().optional().default(true),
      }),
    )
    .min(1, 'Ajoutez au moins un produit')
    .max(100),
  note: z.string().trim().max(2000).optional(),
})

// Dépenses / charges opérationnelles (gastos) → compte de résultat. STRICT.
// created_by dérivé serveur (auth.userId), jamais du body.
// NB : 'merma' n'est PAS dans cette enum (catégorie réservée aux pertes de
// stock, écrites uniquement par la RPC record_stock_loss en service-role).
// → un POST manuel /api/admin/expenses avec category:'merma' est rejeté (400),
// ce qui empêche un double-booking. La CHECK DB accepte 9 valeurs (8 + merma).
export const EXPENSE_CATEGORIES = [
  'alquiler', 'salarios', 'servicios', 'mercadeo',
  'suministros', 'mantenimiento', 'impuestos', 'otros',
] as const

export const expenseCreate = z.object({
  amount: z.number().positive('Monto inválido').max(100_000_000),
  category: z.enum(EXPENSE_CATEGORIES),
  label: z.string().trim().max(200).optional(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (AAAA-MM-JJ)'),
  note: z.string().trim().max(2000).optional(),
})

export const expenseDelete = z.object({
  id: z.string().uuid('id invalide'),
})

// Perte de stock (merma / producto vencido) → décrément + charge au coût.
// Le coût est lu côté serveur dans la RPC (jamais du body). Bornes alignées
// sur le garde-fou in-RPC (qty 1..1e6). client_token = idempotence.
export const STOCK_LOSS_REASONS = ['vencido', 'danado', 'robo', 'ajuste'] as const

export const stockLossBody = z.object({
  client_token: z.string().uuid('client_token invalide'),
  product_id: z.string().uuid('product_id invalide'),
  quantity: z.number().int().positive('Cantidad inválida').max(1_000_000),
  reason: z.enum(STOCK_LOSS_REASONS),
  note: z.string().trim().max(2000).optional(),
})

// Campagnes promo (% ou montant fixe) ciblant produit / marque / gamme / tag.
// STRICT ; created_by dérivé serveur. Dates ISO (datetime avec offset), passées
// brutes dans les colonnes timestamptz. Refines : percent ≤ 100 et end > start.
export const PROMOTION_TARGET_TYPES = ['product', 'brand', 'range', 'tag'] as const

const promotionTarget = z.object({
  target_type: z.enum(PROMOTION_TARGET_TYPES),
  target_id: z.string().uuid('target_id invalide'),
})

const promotionShape = {
  name: z.string().trim().min(1, 'Nombre requerido').max(120),
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.number().nonnegative('Valor inválido').max(100_000_000),
  start_date: z.string().datetime({ offset: true, message: 'Fecha inicio inválida' }),
  end_date: z.string().datetime({ offset: true, message: 'Fecha fin inválida' }),
  is_active: z.boolean().optional(),
  priority: z.number().int().min(0).max(100_000).optional(),
  targets: z.array(promotionTarget).min(1, 'Añade al menos un objetivo').max(1000),
}

type PromotionRefineInput = {
  discount_type: 'percent' | 'fixed'
  discount_value: number
  start_date: string
  end_date: string
}
const percentWithinBounds = (p: PromotionRefineInput) =>
  p.discount_type !== 'percent' || p.discount_value <= 100
const endAfterStart = (p: PromotionRefineInput) =>
  new Date(p.end_date) > new Date(p.start_date)
const PERCENT_MSG = { message: 'Un porcentaje no puede superar 100', path: ['discount_value'] }
const WINDOW_MSG = { message: 'La fecha fin debe ser posterior al inicio', path: ['end_date'] }

export const promotionCreate = z
  .object(promotionShape)
  .refine(percentWithinBounds, PERCENT_MSG)
  .refine(endAfterStart, WINDOW_MSG)

export const promotionUpdate = z
  .object({ id: z.string().uuid('id invalide'), ...promotionShape })
  .refine(percentWithinBounds, PERCENT_MSG)
  .refine(endAfterStart, WINDOW_MSG)

// Panier public : POST (incrément) et PATCH (quantité absolue). Borne 1..99
// = MAX_CART_QUANTITY ; productId doit être un UUID. [C-28]
export const cartItemBody = z.object({
  productId: z.string().uuid('productId invalide'),
  quantity: z.number().int().min(1).max(99),
})

const VALID_SLOTS = ['hero', 'banner', 'card', 'modal'] as const
const VALID_STATUSES = ['draft', 'scheduled', 'active', 'paused', 'expired'] as const

export const bannerCreate = z.object({
  title: z.string().min(1, 'title requis'),
  description: z.string().nullish(),
  image_url: z.string().nullish(),
  link_url: z.string().nullish(),
  link_text: z.string().nullish(),
  banner_type: z.enum(VALID_BANNER_TYPES),
  position: z.number().int().optional(),
  is_active: z.boolean().optional(),
  slot: z.enum(VALID_SLOTS).default('banner'),
  status: z.enum(VALID_STATUSES).default('draft'),
  start_date: z.string().nullish(),
  end_date: z.string().nullish(),
  direction: z.enum(['left', 'right']).nullish(),
  attribution_name: z.string().nullish(),
  attribution_title: z.string().nullish(),
  attribution_photo_url: z.string().nullish(),
})

export const bannerUpdate = z.object({
  id: z.string().uuid('id requis'),
  title: z.string().optional(),
  description: z.string().nullish(),
  image_url: z.string().nullish(),
  link_url: z.string().nullish(),
  link_text: z.string().nullish(),
  banner_type: z.enum(VALID_BANNER_TYPES).optional(),
  position: z.number().int().optional(),
  is_active: z.boolean().optional(),
  slot: z.enum(VALID_SLOTS).optional(),
  status: z.enum(VALID_STATUSES).optional(),
  start_date: z.string().nullish(),
  end_date: z.string().nullish(),
  direction: z.enum(['left', 'right']).nullish(),
  attribution_name: z.string().nullish(),
  attribution_title: z.string().nullish(),
  attribution_photo_url: z.string().nullish(),
})

// Système de tickets de support (contact_messages)
export const TICKET_CATEGORIES = ['bug', 'order', 'product', 'account', 'other'] as const
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const
export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

// PATCH admin d'un ticket (statut / catégorie / priorité / notes internes)
export const messagePatch = z.object({
  id: z.string().uuid('id requis'),
  status: z.enum(TICKET_STATUSES).optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  admin_notes: z.string().max(4000).optional(),
  replied_at: z.string().optional(),
})

// Création publique d'un ticket (centre d'aide /aide + page /contact).
// Email requis mais PAS de compte requis (tickets anonymes autorisés).
export const ticketCreate = z.object({
  email: z.string().trim().email('Email invalide').max(200),
  category: z.enum(TICKET_CATEGORIES).optional(),
  subject: z.string().trim().min(1, 'Sujet requis').max(200),
  message: z.string().trim().min(1, 'Message requis').max(4000),
})

export const reservationPatch = z.object({
  id: z.string().uuid('id requis'),
  status: z.enum(['pending', 'confirmed', 'collected', 'expired', 'cancelled']).optional(),
  admin_notes: z.string().optional(),
  // P-FLEX volet 1 : ajustement admin du prix FACTURÉ d'une ligne (tarif
  // préférentiel client fidèle). La RPC set_reservation_item_price refuse
  // hors pending/confirmed et recalcule total_price atomiquement ; tracé en
  // audit high-impact côté route. Route admin only — jamais exposé au client.
  item_update: z
    .object({
      item_id: z.string().uuid(),
      unit_price: z.number().min(0).max(100_000_000),
    })
    .optional(),
})

// Réservation INVITÉ depuis la boutique (visiteur sans compte). Les items
// viennent du panier serveur (cookie) — JAMAIS du client (anti-manipulation
// de prix). Seuls les coordonnées de contact sont fournies. Téléphone requis
// (WhatsApp de retrait), nom recommandé, email optionnel.
export const guestReservationBody = z.object({
  contact_name: z.string().trim().max(160).optional(),
  contact_phone: z.string().trim().min(5, 'Téléphone requis').max(40),
  contact_email: z
    .union([z.string().trim().email('Email invalide').max(200), z.literal('')])
    .optional(),
})

// Création de compte « express » par l'admin au comptoir : nom + prénom +
// téléphone seulement. Le serveur synthétise un email, crée le compte et
// renvoie un lien de configuration (envoyé au client par WhatsApp).
export const quickCreateUser = z.object({
  first_name: z.string().trim().min(1, 'Prénom requis').max(80),
  last_name: z.string().trim().max(80).optional(),
  phone: z.string().trim().min(5, 'Téléphone requis').max(40),
  locale: z.enum(['fr', 'es', 'en']).optional(),
})

// Création manuelle par l'admin (vente comptoir / réservation sans compte).
// Toutes les coordonnées sont FACULTATIVES → un achat/réservation anonyme est
// possible (identifié par sa référence #FAR-…). Seuls les produits sont requis.
export const reservationCreate = z.object({
  contact_name: z.string().trim().max(160).optional(),
  // Téléphone facultatif : accepte un numéro valide, une chaîne vide ('') ou
  // l'absence → normalisé en null côté route (colonne désormais nullable).
  contact_phone: z.union([z.string().trim().min(5, 'Téléphone trop court').max(40), z.literal('')]).optional(),
  // accepte une chaîne vide ('') depuis le formulaire → traitée comme absente côté route
  contact_email: z.union([z.string().trim().email('Email invalide').max(200), z.literal('')]).optional(),
  // Association à un compte client (vente comptoir liée). null = anonyme/invité.
  user_id: z.string().uuid('user_id invalide').nullish(),
  admin_notes: z.string().trim().max(2000).optional(),
  // Vente au comptoir déjà finalisée (le client repart avec la marchandise) →
  // la réservation naît directement en statut collected + décrément du stock.
  // Sinon = pending. status/source ne sont PAS exposés (dérivés serveur).
  sold: z.boolean().optional().default(false),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid().nullable().optional(),
        product_name: z.string().trim().min(1, 'Nom produit requis').max(300),
        unit_price: z.number().nonnegative('Prix invalide'),
        quantity: z.number().int().positive('Quantité invalide').max(999),
      }),
    )
    .min(1, 'Ajoutez au moins un produit')
    .max(100),
})

// Champs RÉELLEMENT envoyés par le formulaire admin (ProductFormState).
// Strict (pas de .passthrough()) → Zod retire les clés inconnues, fermant le
// mass-assignment (is_active/is_featured/old_price/currency/id/created_at…). [C-09]
// brand_id/range_id restent `string` (le form envoie '' quand non sélectionné ;
// la route normalise '' → null, et la FK DB valide l'UUID).
// NB : `stock` est VOLONTAIREMENT absent (comme `is_active`). Le stock se gère
// uniquement sur l'écran Stock (réception → CMP, ajustement, initialisation,
// perte) — le strip Zod garantit que le formulaire produit ne peut pas
// l'écraser (ce qui désynchroniserait le coût moyen pondéré). Un produit créé
// démarre à stock 0 (défaut DB) + hors ligne. Invariant testé (schemas.test).
export const productCreate = z.object({
  name: z.string().trim().min(1, 'name requis').max(300),
  slug: z.string().trim().min(1, 'slug requis').max(300),
  description: z.string().max(5000).optional(),
  price: z.number().nonnegative('Prix invalide'),
  brand_id: z.string().optional(),
  range_id: z.string().nullish(),
  imageFile: z.string().optional(),
  selectedTags: z.array(z.string().uuid()).optional(),
})

// PATCH : mêmes champs, tous optionnels (mise à jour partielle). `stock` exclu
// au même titre que `is_active` — le stock ne se modifie QUE via l'écran Stock
// (route /api/admin/stock + RPC qui tracent le coût). Invariant testé.
export const productUpdate = z.object({
  name: z.string().trim().min(1).max(300).optional(),
  slug: z.string().trim().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  price: z.number().nonnegative().optional(),
  brand_id: z.string().optional(),
  range_id: z.string().nullish(),
  imageFile: z.string().optional(),
  selectedTags: z.array(z.string().uuid()).optional(),
})

// Activation/désactivation EXPLICITE d'un produit (route dédiée
// /api/admin/products/[id]/active). Volontairement HORS de productUpdate :
// le strip d'is_active y est un invariant testé anti-mass-assignment
// (schemas.test.ts) — l'activation est une action délibérée, pas un champ
// du formulaire produit. C'est le levier de la barrière L-3 du lancement.
export const productActiveBody = z.object({
  is_active: z.boolean(),
})

export const userPatch = z.object({
  is_admin: z.boolean().optional(),
})

export const setLocaleBody = z.object({
  locale: z.enum(['fr', 'es', 'en']),
})

// Effacement de compte (droit à l'oubli, Ley 172-13 RD). Le client doit saisir
// le mot exact 'ELIMINAR' (confirmation explicite, anti clic accidentel /
// anti-CSRF de fond). La valeur est figée — pas de localisation côté serveur
// pour garder la confirmation déterministe (l'UI affiche le mot à recopier).
export const accountDeleteBody = z.object({
  confirm: z.literal('ELIMINAR'),
})

export const bannerStatsBody = z.object({
  bannerId: z.string().uuid('bannerId requis'),
  type: z.enum(['view', 'click']),
})

export const uploadBody = z.object({
  file: z.string().min(1, 'file requis'),
  fileName: z.string().min(1, 'fileName requis'),
  contentType: z.string().min(1, 'contentType requis'),
  folder: z.enum(['products', 'blog', 'banners']).default('products'),
})

export const postCreate = z.object({
  title: z.string().min(1, 'title requis'),
  slug: z.string().min(1, 'slug requis'),
  excerpt: z.string().nullish(),
  body: z.string().default(''),
  cover_image_url: z.string().nullish(),
  author_name: z.string().nullish(),
  locale: z.enum(['fr', 'es', 'en']).default('fr'),
  is_published: z.boolean().default(false),
  published_at: z.string().nullish(),
})

export const postUpdate = z.object({
  id: z.string().uuid('id requis'),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  excerpt: z.string().nullish(),
  body: z.string().optional(),
  cover_image_url: z.string().nullish(),
  author_name: z.string().nullish(),
  locale: z.enum(['fr', 'es', 'en']).optional(),
  is_published: z.boolean().optional(),
  published_at: z.string().nullish(),
})

export const postDelete = z.object({
  id: z.string().uuid('id invalide'),
})

// Avis produit — création côté client. STRICT (pas de .passthrough()) : ni
// `status` ni `verified_purchase` ne sont acceptés du client, ils sont calculés
// et forcés côté serveur (anti mass-assignment, cf. productCreate).
export const reviewCreate = z.object({
  product_id: z.string().uuid('product_id invalide'),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().max(2000).optional(),
})

// Modération admin d'un avis.
export const reviewModerate = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
})

// Apparence du site public (thème + mode + override visiteur). Les valeurs
// possibles sont aussi listées dans src/lib/themes.ts (garder en phase).
export const appearanceBody = z.object({
  theme: z.enum(['terra', 'noir', 'botanico', 'coral', 'marino', 'ambar']),
  default_mode: z.enum(['light', 'dark', 'system']),
  allow_visitor_mode: z.boolean(),
})

// Ordre + visibilité des sections de la home (cf. src/lib/homeSections.ts).
export const homeLayoutBody = z.object({
  layout: z
    .array(
      z.object({
        key: z.enum(HOME_SECTION_KEYS),
        enabled: z.boolean(),
      }),
    )
    .min(1),
})
