'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  HomeIcon,
  CubeIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ArchiveBoxIcon,
  TagIcon,
  ShoppingBagIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navigation = [
    { name: 'Vue d\'ensemble', href: '/admin/overview', icon: HomeIcon },
    { name: 'Produits', href: '/admin/product', icon: CubeIcon },
    { name: 'Stock', href: '/admin/stock', icon: ArchiveBoxIcon },
    { name: 'Tags', href: '/admin/tags', icon: TagIcon },
    { name: 'Commandes', href: '/admin/commande', icon: ShoppingBagIcon },
    { name: 'Annonces', href: '/admin/annonce', icon: MegaphoneIcon },
    { name: 'Mon équipe', href: '/admin/my-team', icon: UsersIcon },
    { name: 'Statistiques', href: '/admin/statistics', icon: ChartBarIcon },
    { name: 'Paramètres', href: '/admin/settings', icon: CogIcon },
    { name: 'Configuration', href: '/admin/setup', icon: CogIcon },
  ]

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/login?redirectedFrom=' + pathname
        return
      }

      const isAdminFromMeta = session.user.app_metadata?.role === 'admin'
      
      if (!isAdminFromMeta) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single()

        if (!profile?.is_admin) {
          window.location.href = '/login?redirectedFrom=' + pathname + '&error=unauthorized'
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white shadow-lg`}>
        <div className="flex flex-col h-full">
          {/* Logo et toggle */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            {sidebarOpen && (
              <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-1.5 rounded-md hover:bg-gray-100 ${!sidebarOpen && 'mx-auto'}`}
            >
              {sidebarOpen ? (
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${!sidebarOpen && 'justify-center'}
                  `}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <item.icon className={`h-5 w-5 ${sidebarOpen && 'mr-3'}`} />
                  {sidebarOpen && item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info et logout */}
          <div className="px-2 py-4 border-t">
            {sidebarOpen && (
              <div className="px-2 py-2 mb-2">
                <p className="text-xs text-gray-500">Connecté en tant que</p>
                <p className="text-sm font-medium text-gray-700 truncate">{user?.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`
                flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 
                rounded-md hover:bg-red-50
                ${!sidebarOpen && 'justify-center'}
              `}
              title={!sidebarOpen ? 'Déconnexion' : undefined}
            >
              <ArrowRightOnRectangleIcon className={`h-5 w-5 ${sidebarOpen && 'mr-3'}`} />
              {sidebarOpen && 'Déconnexion'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
} 