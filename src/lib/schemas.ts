import { z } from 'zod'
import { NextResponse } from 'next/server'

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

export const bannerCreate = z.object({
  title: z.string().min(1, 'title requis'),
  description: z.string().nullish(),
  image_url: z.string().nullish(),
  link_url: z.string().nullish(),
  link_text: z.string().nullish(),
  banner_type: z.enum(VALID_BANNER_TYPES),
  position: z.number().int().optional(),
  is_active: z.boolean().optional(),
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
  start_date: z.string().nullish(),
  end_date: z.string().nullish(),
  direction: z.enum(['left', 'right']).nullish(),
  attribution_name: z.string().nullish(),
  attribution_title: z.string().nullish(),
  attribution_photo_url: z.string().nullish(),
})

export const messagePatch = z.object({
  id: z.string().uuid('id requis'),
  status: z.string().optional(),
  priority: z.string().optional(),
  admin_notes: z.string().optional(),
  replied_at: z.string().optional(),
})

export const reservationPatch = z.object({
  id: z.string().uuid('id requis'),
  status: z.enum(['pending', 'confirmed', 'collected', 'expired', 'cancelled']).optional(),
  admin_notes: z.string().optional(),
})

export const productCreate = z.object({
  name: z.string().min(1, 'name requis'),
  slug: z.string().min(1, 'slug requis'),
  brand_id: z.string().uuid().optional(),
  range_id: z.string().uuid().nullish(),
  selectedTags: z.array(z.string().uuid()).optional(),
  imageFile: z.string().optional(),
}).passthrough()

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
})
