'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  UsersIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ArchiveBoxIcon,
  TagIcon,
  MegaphoneIcon,
  BuildingStorefrontIcon,
  EnvelopeIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline'

const NAVIGATION = [
  { name: 'Réservations', href: '/admin/reservations', icon: ClipboardDocumentCheckIcon },
  { name: 'Produits',     href: '/admin/product',  icon: CubeIcon },
  { name: 'Marques',      href: '/admin/marques',  icon: BuildingStorefrontIcon },
  { name: 'Stock',        href: '/admin/stock',    icon: ArchiveBoxIcon },
  { name: 'Tags',         href: '/admin/tags',     icon: TagIcon },
  { name: 'Messages',     href: '/admin/messages', icon: EnvelopeIcon },
  { name: 'Annonces',     href: '/admin/annonce',  icon: MegaphoneIcon },
  { name: 'Mon équipe',   href: '/admin/my-team',  icon: UsersIcon },
  { name: 'Paramètres',   href: '/admin/settings', icon: CogIcon },
  { name: 'Configuration', href: '/admin/setup',   icon: CogIcon },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, isAdmin, loading } = useIsAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Le middleware redirige déjà côté serveur. Ce useEffect couvre les cas
  // où l'utilisateur perd sa session pendant qu'il est sur une page admin.
  useEffect(() => {
    if (loading) return
    if (!user) {
      window.location.href = `/login?redirectedFrom=${pathname}`
    } else if (!isAdmin) {
      window.location.href = `/login?redirectedFrom=${pathname}&error=unauthorized`
    }
  }, [loading, user, isAdmin, pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clay-700 mx-auto"></div>
          <p className="mt-4 text-ink-700">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white shadow-lg`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            {sidebarOpen && (
              <h2 className="text-xl font-semibold text-ink-800">Admin Panel</h2>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-1.5 rounded-md hover:bg-sand-100 ${!sidebarOpen && 'mx-auto'}`}
              aria-label={sidebarOpen ? 'Réduire la barre latérale' : 'Ouvrir la barre latérale'}
            >
              {sidebarOpen ? (
                <ChevronLeftIcon className="h-5 w-5 text-ink-700" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-ink-700" />
              )}
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {NAVIGATION.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${isActive
                      ? 'bg-clay-50 text-clay-800'
                      : 'text-ink-700 hover:bg-sand-100 hover:text-ink-900'
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

          <div className="px-2 py-4 border-t">
            {sidebarOpen && (
              <div className="px-2 py-2 mb-2">
                <p className="text-xs text-ink-500">Connecté en tant que</p>
                <p className="text-sm font-medium text-ink-800 truncate">{user.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`
                flex items-center w-full px-2 py-2 text-sm font-medium text-brick-600
                rounded-md hover:bg-clay-50
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

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
