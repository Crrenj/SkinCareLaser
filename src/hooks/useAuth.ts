'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from './useCart'

export function useAuth() {
  const router = useRouter()
  const { refreshCart } = useCart()

  useEffect(() => {
    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Utilisateur vient de se connecter
          await handleUserLogin(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          // Utilisateur s'est déconnecté
          await handleUserLogout()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleUserLogin = async (userId: string) => {
    try {
      // Récupérer l'ID anonyme du cookie
      const cartId = getCookie('cart_id')
      
      if (cartId) {
        // Fusionner le panier anonyme avec l'utilisateur connecté
        const { error } = await supabase
          .from('carts')
          .update({ 
            user_id: userId, 
            anonymous_id: null 
          })
          .eq('anonymous_id', cartId)

        if (error) {
          console.error('Erreur fusion panier:', error)
        } else {
          // Supprimer le cookie
          deleteCookie('cart_id')
          
          // Recharger le panier
          await refreshCart()
        }
      }
    } catch (error) {
      console.error('Erreur lors de la fusion du panier:', error)
    }
  }

  const handleUserLogout = async () => {
    try {
      // Supprimer le cookie du panier
      deleteCookie('cart_id')
      
      // Recharger le panier (sera vide pour l'utilisateur déconnecté)
      await refreshCart()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

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