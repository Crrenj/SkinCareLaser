import { logger } from '@/lib/logger'
import 'server-only'
import { cache } from 'react'
import { createSupabaseServerClient } from './supabaseServer'
import type { Database } from './database.types'

export type ShopSettings = Database['public']['Tables']['shop_settings']['Row']

/**
 * Valeurs de secours quand la lecture DB échoue (DB down, RLS bug,
 * première charge avant migration). Évite de casser le rendu des pages
 * publiques qui dépendent de ces infos.
 */
const FALLBACK: ShopSettings = {
  id: 1,
  shop_name: 'FARMAU',
  shop_tagline: null,
  contact_email: null,
  contact_phone: null,
  whatsapp_number: null,
  pickup_name: null,
  pickup_address: null,
  pickup_hours: null,
  pickup_phone: null,
  shipping_santo_domingo: 300,
  shipping_interior: 600,
  updated_at: new Date(0).toISOString(),
  updated_by: null,
}

/**
 * Lit la configuration boutique (row id=1). Dédupliqué par requête grâce
 * à React `cache()` : plusieurs Server Components qui appellent ce helper
 * dans le même render font une seule query Supabase.
 *
 * RLS autorise la lecture publique de `shop_settings` donc on utilise le
 * client serveur (cookie-based, role anon), pas le service-role.
 *
 * Sur erreur (DB unreachable, ligne manquante) on log et on retourne
 * FALLBACK pour ne jamais casser le rendu d'une page publique.
 */
export const getShopSettings = cache(async (): Promise<ShopSettings> => {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error || !data) {
      if (error) logger.error('[getShopSettings]', error.message)
      return FALLBACK
    }
    return data
  } catch (error) {
    logger.error('[getShopSettings] unexpected', error)
    return FALLBACK
  }
})

/**
 * Helpers de formatage des numéros pour les href tel: et wa.me/.
 * Le DB stocke les numéros au format affichage (`+1 809 724 3940`),
 * mais tel: et wa.me veulent un format compact ne contenant que des
 * chiffres (et optionnellement le `+` pour tel:).
 */

export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : null
}

export function whatsappHref(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

export function mailtoHref(email: string | null | undefined): string | null {
  if (!email) return null
  return `mailto:${email}`
}
