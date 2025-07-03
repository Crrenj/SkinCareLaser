import { createBrowserClient } from '@supabase/ssr'

/**
 * ⚠️ ATTENTION - CODE CRITIQUE DE CONNEXION ⚠️
 * 
 * Ce fichier gère l'authentification Supabase avec des corrections spéciales pour :
 * - La navigation privée
 * - Les erreurs SSR (Server-Side Rendering)
 * - Les problèmes de cookies
 * 
 * 🚨 NE PAS MODIFIER SANS AUTORISATION 🚨
 * 
 * Problèmes résolus :
 * - "document is not defined" en SSR
 * - Cookies bloqués en navigation privée
 * - Sessions perdues lors des redirections
 * 
 * Si vous devez modifier ce code :
 * 1. Demandez l'autorisation
 * 2. Testez en navigation normale ET privée
 * 3. Vérifiez que le SSR fonctionne
 * 4. Testez toutes les pages de login
 */

/**
 * Client Supabase pour le navigateur
 * Utilise createBrowserClient avec configuration optimisée pour la navigation privée et SSR
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        // ⚠️ PROTECTION SSR : Vérifier que nous sommes côté client
        if (typeof window === 'undefined') {
          return undefined
        }
        
        try {
          // Essayer d'abord les cookies, puis le localStorage en fallback
          const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(name + '='))
            ?.split('=')[1]
          
          if (cookie) return cookie
          
          // Fallback pour navigation privée
          try {
            return localStorage.getItem(`sb-${name}`) || undefined
          } catch {
            return undefined
          }
        } catch (error) {
          console.warn('Erreur lecture cookie/localStorage:', error)
          return undefined
        }
      },
      set(name: string, value: string, options: any) {
        // ⚠️ PROTECTION SSR : Vérifier que nous sommes côté client
        if (typeof window === 'undefined') {
          return
        }
        
        try {
          // Essayer de définir le cookie normalement
          const cookieStr = `${name}=${value}; path=/; ${options.maxAge ? `max-age=${options.maxAge}` : ''}; SameSite=Lax`
          document.cookie = cookieStr
        } catch (error) {
          console.warn('Cookie non défini, utilisation du localStorage:', error)
        }
        
        // Fallback pour navigation privée
        try {
          if (value) {
            localStorage.setItem(`sb-${name}`, value)
          } else {
            localStorage.removeItem(`sb-${name}`)
          }
        } catch (error) {
          console.warn('localStorage non disponible:', error)
        }
      },
      remove(name: string, options: any) {
        // ⚠️ PROTECTION SSR : Vérifier que nous sommes côté client
        if (typeof window === 'undefined') {
          return
        }
        
        try {
          // Supprimer le cookie
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
        } catch (error) {
          console.warn('Cookie non supprimé:', error)
        }
        
        // Supprimer du localStorage
        try {
          localStorage.removeItem(`sb-${name}`)
        } catch (error) {
          console.warn('localStorage non accessible:', error)
        }
      }
    }
  }
)
