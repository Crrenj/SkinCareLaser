'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Toaster } from 'sonner'
import { useTranslations } from 'next-intl'
import useSWR from 'swr'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { supabase } from '@/lib/supabaseClient'
import { Sidebar } from '@/components/admin/dashboard/Sidebar'
import { AdminModeProvider } from '@/components/admin/dashboard/AdminModeContext'
import { isThemeName, type ThemeName } from '@/lib/themes'

// Préférence clair/sombre PROPRE à l'admin, indépendante du mode visiteur
// du site public (`farmau:mode`). Le THÈME (palette), lui, suit l'apparence
// choisie dans /admin/apariencia — comme le site public.
const ADMIN_MODE_KEY = 'farmau:admin-mode'

const themeFetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ theme: string }>)

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

  // Pseudo de l'admin connecté (nom affiché dans la carte identité du
  // sidebar). Lecture de SON propre profil — couverte par la RLS.
  const userId = user?.id
  const [displayName, setDisplayName] = useState<string | undefined>()
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setDisplayName(data?.display_name ?? undefined)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  // Thème d'apparence (choisi dans /admin/apariencia, live via /api/theme).
  // L'admin reflète la même palette que le site public ; seul le mode
  // clair/sombre reste propre à l'admin (toggle du PageHeader).
  const { data: themeData } = useSWR<{ theme: string }>('/api/theme', themeFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })
  const [siteTheme, setSiteTheme] = useState<ThemeName>('terra')
  // Au mount : `<html data-theme>` EST déjà le thème d'apparence frais (l'admin
  // est rendu dynamiquement → valeur runtime de getThemeConfig). On le lit
  // tout de suite (source la plus fraîche, jamais en cache CDN).
  useEffect(() => {
    const fromHtml = document.documentElement.getAttribute('data-theme')
    if (isThemeName(fromHtml)) setSiteTheme(fromHtml)
  }, [])
  // Mise à jour LIVE après un save dans /apariencia (globalMutate('/api/theme')).
  useEffect(() => {
    if (isThemeName(themeData?.theme)) setSiteTheme(themeData.theme)
  }, [themeData])

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
        data-theme={siteTheme}
        data-mode={mode}
        className="min-h-screen flex items-center justify-center bg-sand-100"
      >
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-sand-300 border-t-clay-700" />
      </div>
    )
  }

  if (!user || !isAdmin) return null

  return (
    // L'admin adopte le thème d'apparence choisi (comme le public) ; seul le
    // mode clair/sombre est propre à l'admin (toggle du PageHeader).
    <AdminModeProvider value={{ mode, toggleMode }}>
      <div data-theme={siteTheme} data-mode={mode} className="flex min-h-screen bg-sand-50 text-ink-900">
        <Sidebar
          mobileOpen={drawerOpen}
          onCloseMobile={() => setDrawerOpen(false)}
          email={user.email ?? undefined}
          displayName={displayName}
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
            <span className="ml-auto text-[11px] tracking-[0.12em] uppercase text-ink-500">
              {tChrome('adminBadge')}
            </span>
          </div>

          <main className="flex-1 min-w-0">{children}</main>
        </div>

        <Toaster richColors position="top-right" closeButton />
      </div>
    </AdminModeProvider>
  )
}
