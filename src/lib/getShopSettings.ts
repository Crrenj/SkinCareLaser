import 'server-only'
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { logger } from './logger'

export type ShopSettings = Database['public']['Tables']['shop_settings']['Row']

/** Tag de revalidation on-demand (appelé par /api/admin/settings après save). */
export const SHOP_SETTINGS_TAG = 'shop-settings-config'

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
  theme: 'terra',
  default_mode: 'light',
  allow_visitor_mode: true,
  home_layout: null,
  updated_at: new Date(0).toISOString(),
  updated_by: null,
}

/**
 * Lit la configuration boutique (row id=1) SANS toucher aux cookies — un
 * client anon dédié (pas `supabaseServer`, qui lit les cookies et forcerait
 * tout le site en rendu dynamique + sert le FALLBACK figé, cf. audit C-01).
 * Wrappé dans `unstable_cache` : une seule requête partagée entre toutes les
 * pages, invalidée via `revalidateTag(SHOP_SETTINGS_TAG)` au save admin ou
 * après 5 min. RLS autorise le SELECT public sur `shop_settings`.
 *
 * Sur erreur (DB unreachable, ligne manquante) on log et on retourne FALLBACK
 * pour ne jamais casser le rendu d'une page publique.
 */
const readShopSettings = unstable_cache(
  async (): Promise<ShopSettings> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return FALLBACK
    try {
      const supabase = createClient<Database>(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
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
  },
  ['shop-settings-v1'],
  { tags: [SHOP_SETTINGS_TAG], revalidate: 300 },
)

export function getShopSettings(): Promise<ShopSettings> {
  return readShopSettings()
}

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
