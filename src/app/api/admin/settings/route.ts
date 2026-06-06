import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { apiError } from '@/lib/apiError'
import { SHOP_SETTINGS_TAG } from '@/lib/getShopSettings'
import type { Database } from '@/lib/database.types'

type SettingsUpdate = Database['public']['Tables']['shop_settings']['Update']

/**
 * Configuration boutique (single-row pattern, id = 1).
 *
 * GET  : retourne la ligne complète. Admin-only ici par symétrie avec les
 *        autres /api/admin/*, mais la RLS autorise aussi la lecture publique
 *        directement via supabase (sans passer par cette route) — utile pour
 *        afficher les infos boutique sur les pages /livraison, /pharmacie,
 *        /contact, etc.
 *
 * PATCH : met à jour les champs envoyés (allowlist explicite). Réservé admin.
 *         updated_by est stamped automatiquement depuis la session admin.
 */

// Click & Collect : aucun tarif de livraison n'est édité ici (les colonnes
// shipping_* restent en DB, inertes — le tunnel de réservation est gratuit).
const TEXT_FIELDS = [
  'shop_name',
  'shop_tagline',
  'contact_email',
  'contact_phone',
  'whatsapp_number',
  'pickup_name',
  'pickup_address',
  'pickup_hours',
  'pickup_phone',
] as const


export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('shop_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return apiError('Erreur lors de la lecture des paramètres', error, 500)
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  try {
    const body = (await req.json()) as Record<string, unknown>

    // Allowlist : on ne passe à UPDATE que les champs explicitement autorisés.
    const patch: SettingsUpdate = {}
    for (const field of TEXT_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        const raw = body[field]
        const value = raw == null || raw === '' ? null : String(raw)
        if (value && value.length > 400) {
          return NextResponse.json(
            { error: `Le champ ${field} dépasse 400 caractères` },
            { status: 400 },
          )
        }
        if (
          field === 'contact_email' &&
          value &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          return NextResponse.json({ error: 'Email de contact invalide' }, { status: 400 })
        }
        if (field === 'shop_name') {
          // NOT NULL en DB
          if (!value) {
            return NextResponse.json(
              { error: 'shop_name est obligatoire' },
              { status: 400 },
            )
          }
          patch.shop_name = value
        } else {
          patch[field] = value
        }
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('shop_settings')
      .update({ ...patch, updated_by: auth.userId })
      .eq('id', 1)
      .select()
      .single()

    if (error) throw error
    revalidateTag(SHOP_SETTINGS_TAG)
    return NextResponse.json(data)
  } catch (error) {
    return apiError('Erreur lors de la sauvegarde des paramètres', error, 500)
  }
}
