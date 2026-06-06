'use client'

import { logger } from '@/lib/logger'
import { useEffect, useRef } from 'react'
import { mutate } from 'swr'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from './useCart'

export function useAuth() {
  const { refreshCart } = useCart()
  const previousUserIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    // Handlers définis dans useEffect pour ne pas les inclure dans les deps
    // tout en respectant react-hooks/exhaustive-deps.
    const handleUserLogin = async () => {
      try {
        const res = await fetch('/api/cart/merge', { method: 'POST' })
        if (!res.ok) {
          logger.error('Erreur fusion panier:', res.status)
        }
        await refreshCart()
        // Recharge les favoris pour la nouvelle identité (sinon le cache SWR
        // garde ceux de l'utilisateur précédent sur un navigateur partagé).
        await mutate('/api/wishlist', undefined, { revalidate: true })
      } catch (error) {
        logger.error('Erreur lors de la fusion du panier:', error)
      }
    }

    const handleUserLogout = async () => {
      try {
        await refreshCart()
        // Purge les favoris du cache SWR (le fetch renverra [] en anonyme).
        await mutate('/api/wishlist', undefined, { revalidate: true })
      } catch (error) {
        logger.error('Erreur lors de la déconnexion:', error)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const incomingUserId = session?.user?.id ?? null
        const previousUserId = previousUserIdRef.current
        // Supabase ré-émet `SIGNED_IN` au focus de tab et après chaque
        // TOKEN_REFRESHED. On ne merge que sur une vraie transition
        // (null/undefined -> user). Sinon on re-fetchait le panier
        // (et autres effets) à chaque retour d'onglet.
        if (event === 'SIGNED_IN' && incomingUserId && incomingUserId !== previousUserId) {
          // Vraie transition d'identité : null/undefined -> user, OU userA ->
          // userB (navigateur partagé). On rejoue le merge panier + purge la
          // wishlist dans les DEUX cas, sinon les favoris du compte précédent
          // fuiteraient sur le suivant. [C-23]
          previousUserIdRef.current = incomingUserId
          await handleUserLogin()
        } else if (event === 'SIGNED_OUT' && previousUserId !== null) {
          previousUserIdRef.current = null
          await handleUserLogout()
        } else if (event === 'INITIAL_SESSION') {
          // Initial load : enregistre l'identité sans déclencher le merge
          // (le panier serveur connaît déjà cette session).
          previousUserIdRef.current = incomingUserId
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [refreshCart])

  /**
   * Connecte un utilisateur avec email et mot de passe
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe de l'utilisateur
   * @returns Promesse avec les données de session ou une erreur
   */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      throw error
    }
    
    return data
  }

  /**
   * Inscrit un nouvel utilisateur
   * @param email - Email du nouvel utilisateur
   * @param password - Mot de passe du nouvel utilisateur
   * @returns Promesse avec les données utilisateur ou une erreur
   */
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (error) {
      throw error
    }
    
    return data
  }

  /**
   * Déconnecte l'utilisateur actuel
   * @returns Promesse
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }
  }

  return {
    signIn,
    signUp,
    signOut
  }
}

 