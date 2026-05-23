'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from './useCart'

export function useAuth() {
  const { refreshCart } = useCart()

  useEffect(() => {
    // Handlers définis dans useEffect pour ne pas les inclure dans les deps
    // tout en respectant react-hooks/exhaustive-deps.
    const handleUserLogin = async () => {
      try {
        const cartId = getCookie('cart_id')
        if (!cartId) return
        // Via RPC SECURITY DEFINER : la policy RLS UPDATE de carts exige
        // auth.uid() = user_id, ce qui empêche le merge en mode direct
        // (le cart cible a user_id IS NULL). La RPC valide auth.uid() puis
        // bypass RLS pour reclaim ou fusionner le cart anonyme.
        const { error } = await supabase.rpc('merge_anon_cart_to_user', {
          p_anon_id: cartId,
        })
        if (error) {
          console.error('Erreur fusion panier:', error)
        } else {
          deleteCookie('cart_id')
          await refreshCart()
        }
      } catch (error) {
        console.error('Erreur lors de la fusion du panier:', error)
      }
    }

    const handleUserLogout = async () => {
      try {
        deleteCookie('cart_id')
        await refreshCart()
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserLogin()
        } else if (event === 'SIGNED_OUT') {
          await handleUserLogout()
        }
      }
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

// Utilitaires pour les cookies
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
} 