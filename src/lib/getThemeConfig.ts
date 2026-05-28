import 'server-only'
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { logger } from './logger'
import { isThemeMode, isThemeName, type ThemeMode, type ThemeName } from './themes'

export interface ThemeConfig {
  theme: ThemeName
  defaultMode: ThemeMode
  allowVisitorMode: boolean
}

const DEFAULT: ThemeConfig = { theme: 'terra', defaultMode: 'light', allowVisitorMode: true }

/** Tag de revalidation on-demand (appelé par /api/admin/appearance après save). */
export const THEME_CONFIG_TAG = 'shop-theme-config'

/**
 * Lit le thème actif de `shop_settings` SANS toucher aux cookies — un client
 * anon dédié, pas `supabaseServer` (qui lit les cookies et forcerait tout le
 * site en rendu dynamique). Wrappé dans `unstable_cache` : une seule requête
 * partagée entre toutes les pages, invalidée via `revalidateTag` au save admin
 * ou après 5 min. RLS autorise le SELECT public sur `shop_settings`.
 */
const readThemeConfig = unstable_cache(
  async (): Promise<ThemeConfig> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return DEFAULT
    try {
      const supabase = createClient<Database>(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data, error } = await supabase
        .from('shop_settings')
        .select('theme, default_mode, allow_visitor_mode')
        .eq('id', 1)
        .single()

      if (error || !data) {
        if (error) logger.error('[getThemeConfig]', error.message)
        return DEFAULT
      }
      return {
        theme: isThemeName(data.theme) ? data.theme : DEFAULT.theme,
        defaultMode: isThemeMode(data.default_mode) ? data.default_mode : DEFAULT.defaultMode,
        allowVisitorMode: data.allow_visitor_mode ?? DEFAULT.allowVisitorMode,
      }
    } catch (error) {
      logger.error('[getThemeConfig] unexpected', error)
      return DEFAULT
    }
  },
  ['shop-theme-config-v1'],
  { tags: [THEME_CONFIG_TAG], revalidate: 300 },
)

export function getThemeConfig(): Promise<ThemeConfig> {
  return readThemeConfig()
}

/** Mode concret pour le SSR initial (le script anti-flash affinera `system`). */
export function resolveInitialMode(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'dark' ? 'dark' : 'light'
}
