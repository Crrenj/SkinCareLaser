import { createBrowserClient, type CookieOptions } from '@supabase/ssr'

/**
 * Client Supabase navigateur.
 *
 * Sécurité : pas de fallback localStorage pour les tokens. L'audit
 * sécurité a flaggé que stocker access_token + refresh_token dans
 * localStorage les rend exfiltrables par toute XSS (alors qu'un cookie
 * HttpOnly géré côté serveur n'est jamais exposé au JS). Le fallback
 * historique servait à supporter la navigation privée Safari/Firefox
 * où certains cookies étaient bloqués — c'est désormais résolu côté
 * navigateur (cookies SameSite=Lax acceptés en mode privé) et le risque
 * XSS pesait beaucoup plus lourd que le cas edge restant.
 *
 * Si la navigation privée bloque vraiment les cookies sur un browser
 * donné, l'utilisateur recevra un message "session expirée" classique
 * au lieu de rester connecté — comportement attendu et conforme au
 * threat model.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined
        return document.cookie
          .split('; ')
          .find((row) => row.startsWith(name + '='))
          ?.split('=')[1]
      },
      set(name: string, value: string, options: CookieOptions) {
        if (typeof document === 'undefined') return
        const parts = [`${name}=${value}`, 'path=/', 'SameSite=Lax']
        if (options.maxAge) parts.push(`max-age=${options.maxAge}`)
        if (process.env.NODE_ENV === 'production') parts.push('Secure')
        document.cookie = parts.join('; ')
      },
      remove(name: string, _options: CookieOptions) {
        if (typeof document === 'undefined') return
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
      },
    },
  },
)
