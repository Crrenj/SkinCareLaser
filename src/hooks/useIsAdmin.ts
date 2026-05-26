'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

/**
 * Récupère l'utilisateur connecté + son statut admin.
 *
 * Source de vérité :
 *   1. session.user.app_metadata.role === 'admin'  (rapide, depuis JWT)
 *   2. sinon, RPC is_user_admin (lit admin_users — SoV unifiée avec
 *      middleware/requireAdmin).
 *
 * Réagit aux transitions réelles d'auth : on ne replonge en `loading`
 * que si l'identité de l'utilisateur change. Supabase v2 ré-émet
 * `SIGNED_IN` quand la tab regagne le focus, ce qui faisait clignoter
 * le shell admin (loading spinner -> contenu) à chaque retour de tab.
 *
 * Retourne :
 *   - user     : User | null
 *   - isAdmin  : boolean
 *   - loading  : true pendant la vérification initiale
 */
export function useIsAdmin() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const currentUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function check(forceLoading = false) {
      if (forceLoading) setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      if (!session) {
        currentUserIdRef.current = null
        setUser(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      currentUserIdRef.current = session.user.id
      setUser(session.user)
      const fromMeta = session.user.app_metadata?.role === 'admin'
      if (fromMeta) {
        setIsAdmin(true)
        setLoading(false)
        return
      }

      const { data: isAdminRpc } = await supabase.rpc('is_user_admin', {
        check_user_id: session.user.id,
      })
      if (cancelled) return

      setIsAdmin(isAdminRpc === true)
      setLoading(false)
    }

    check(true)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const incomingUserId = session?.user?.id ?? null
      const previousUserId = currentUserIdRef.current
      // Ignore les ré-émissions de SIGNED_IN au focus de tab quand
      // l'identité ne change pas. Idem TOKEN_REFRESHED : le user reste
      // le même, pas besoin de re-checker l'admin status.
      if (event === 'SIGNED_OUT') {
        if (previousUserId === null) return
        check()
        return
      }
      if (event === 'SIGNED_IN' && incomingUserId !== previousUserId) {
        check()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return { user, isAdmin, loading }
}
