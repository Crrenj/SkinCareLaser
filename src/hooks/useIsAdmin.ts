'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

/**
 * Récupère l'utilisateur connecté + son statut admin.
 *
 * Source de vérité :
 *   1. session.user.app_metadata.role === 'admin'  (rapide, depuis JWT)
 *   2. sinon, table profiles.is_admin
 *
 * Réagit à SIGNED_IN / SIGNED_OUT pour rester à jour.
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

  useEffect(() => {
    let cancelled = false

    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      if (!session) {
        setUser(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setUser(session.user)
      const fromMeta = session.user.app_metadata?.role === 'admin'
      if (fromMeta) {
        setIsAdmin(true)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()
      if (cancelled) return

      setIsAdmin(profile?.is_admin === true)
      setLoading(false)
    }

    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setLoading(true)
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
