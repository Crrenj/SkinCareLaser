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
})

// Création manuelle d'une réservation par l'admin (client walk-in / téléphone
// sans compte). Le téléphone est requis (WhatsApp), l'email est optionnel.
export const reservationCreate = z.object({
  contact_name: z.string().trim().max(160).optional(),
  contact_phone: z.string().trim().min(5, 'Téléphone requis').max(40),
  // accepte une chaîne vide ('') depuis le formulaire → traitée comme absente côté route
  contact_email: z.union([z.string().trim().email('Email invalide').max(200), z.literal('')]).optional(),
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
export const productCreate = z.object({
  name: z.string().trim().min(1, 'name requis').max(300),
  slug: z.string().trim().min(1, 'slug requis').max(300),
  description: z.string().max(5000).optional(),
  price: z.number().nonnegative('Prix invalide'),
  stock: z.number().int().min(0, 'Stock invalide'),
  brand_id: z.string().optional(),
  range_id: z.string().nullish(),
  imageFile: z.string().optional(),
  selectedTags: z.array(z.string().uuid()).optional(),
})

// PATCH : mêmes champs, tous optionnels (mise à jour partielle).
export const productUpdate = z.object({
  name: z.string().trim().min(1).max(300).optional(),
  slug: z.string().trim().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  price: z.number().nonnegative().optional(),
  stock: z.number().int().min(0).optional(),
  brand_id: z.string().optional(),
  range_id: z.string().nullish(),
  imageFile: z.string().optional(),
  selectedTags: z.array(z.string().uuid()).optional(),
})

export const userPatch = z.object({
  is_admin: z.boolean().optional(),
})

export const setLocaleBody = z.object({
  locale: z.enum(['fr', 'es', 'en']),
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
