'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

/**
 * Page du tableau de bord administrateur
 * Accessible uniquement aux utilisateurs avec le rôle admin
 * @returns Page dashboard admin
 */
export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Vérifier l'authentification et le rôle admin
    checkAdminAccess()
  }, [])

  /**
   * Vérifie que l'utilisateur est connecté et est admin
   * Redirige vers login si non autorisé
   */
  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/login?redirectedFrom=/admin/dashboard'
        return
      }

      // Vérifier le rôle admin
      const isAdminFromMeta = session.user.app_metadata?.role === 'admin'
      
      if (!isAdminFromMeta) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single()

        if (!profile?.is_admin) {
          window.location.href = '/login?redirectedFrom=/admin/dashboard&error=unauthorized'
          return
        }
      }

      setUser(session.user)
      setIsAuthorized(true)
    } catch (error) {
      console.error('Erreur vérification accès admin:', error)
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  /**
   * Gère la déconnexion
   */
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Afficher un loader pendant la vérification
  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de bord administrateur
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Bienvenue, Admin ! 👋
              </h2>
              
              <p className="text-gray-600 mb-6">
                Vous êtes connecté en tant qu'administrateur : {user?.email}
              </p>

              {/* TODO: Ajouter les fonctionnalités admin */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Gestion des produits
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Ajouter, modifier et supprimer des produits
                  </p>
                  {/* TODO: Ajouter le lien vers la gestion des produits */}
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Commandes
                  </h3>
                  <p className="text-green-700 text-sm">
                    Voir et gérer les commandes clients
                  </p>
                  {/* TODO: Ajouter le lien vers la gestion des commandes */}
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                    Utilisateurs
                  </h3>
                  <p className="text-purple-700 text-sm">
                    Gérer les comptes utilisateurs
                  </p>
                  {/* TODO: Ajouter le lien vers la gestion des utilisateurs */}
                </div>
              </div>

              <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note :</strong> Cette page est un squelette. Les fonctionnalités admin 
                  seront implémentées progressivement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 