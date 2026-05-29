'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Toaster } from 'sonner'
import { useTranslations } from 'next-intl'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { Sidebar } from '@/components/admin/dashboard/Sidebar'
import { AdminModeToggle } from '@/components/admin/dashboard/AdminModeToggle'

// Préférence clair/sombre PROPRE à l'admin, indépendante du mode visiteur
// du site public (`farmau:mode`). L'admin reste toujours sur le thème Terra.
const ADMIN_MODE_KEY = 'farmau:admin-mode'

/**
 * Shell client qui héberge auth-gate + sidebar + barre mobile.
 * Le AdminLayout serveur l'enveloppe avec NextIntlClientProvider.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAdmin, loading } = useIsAdmin()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const tChrome = useTranslations('Admin.chrome')

  // Lit la préférence persistée après le mount (évite le mismatch
  // d'hydratation : le SSR rend toujours 'light').
  useEffect(() => {
    try {
      if (localStorage.getItem(ADMIN_MODE_KEY) === 'dark') setMode('dark')
    } catch {
      // localStorage indisponible → on reste en clair.
    }
  }, [])

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(ADMIN_MODE_KEY, next)
      } catch {
        // persistance best-effort
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) {
      window.location.href = `/login?redirectedFrom=${pathname}`
    } else if (!isAdmin) {
      window.location.href = `/login?redirectedFrom=${pathname}&error=unauthorized`
    }
  }, [loading, user, isAdmin, pathname])

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // Spinner uniquement au tout premier render quand on n'a encore aucune
  // info sur l'utilisateur. Une fois user+isAdmin connus, on garde le
  // contenu visible même si un re-check passe en `loading=true` (évite
  // le flash spinner à chaque retour de tab).
  if (loading && !user) {
    return (
      <div
        data-theme="terra"
        data-mode={mode}
        className="min-h-screen flex items-center justify-center bg-sand-100"
      >
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-sand-300 border-t-clay-700" />
      </div>
    )
  }

  if (!user || !isAdmin) return null

  return (
    // L'admin reste neutre (Terra) quel que soit le thème public choisi ; seul
    // le mode clair/sombre est basculable via le toggle (préférence dédiée).
    <div data-theme="terra" data-mode={mode} className="flex min-h-screen bg-sand-50">
      <Sidebar
        mobileOpen={drawerOpen}
        onCloseMobile={() => setDrawerOpen(false)}
        email={user.email ?? undefined}
        mode={mode}
        onToggleMode={toggleMode}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden sticky top-0 z-20 bg-sand-100 border-b border-sand-300 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 rounded-md flex items-center justify-center text-ink-900 hover:bg-sand-200 transition-colors"
            aria-label={tChrome('openMenu')}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-serif text-[20px] text-ink-900">FARMAU</span>
          <div className="ml-auto flex items-center gap-2.5">
            <AdminModeToggle mode={mode} onToggle={toggleMode} className="h-8 w-8" />
            <span className="text-[11px] tracking-[0.12em] uppercase text-ink-500">
              {tChrome('adminBadge')}
            </span>
          </div>
        </div>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <Toaster richColors position="top-right" closeButton />
    </div>
  )
}
