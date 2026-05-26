'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Toaster } from 'sonner'
import { useTranslations } from 'next-intl'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { Sidebar } from '@/components/admin/dashboard/Sidebar'

/**
 * Shell client qui héberge auth-gate + sidebar + barre mobile.
 * Le AdminLayout serveur l'enveloppe avec NextIntlClientProvider.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAdmin, loading } = useIsAdmin()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const tChrome = useTranslations('Admin.chrome')

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-100">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-sand-300 border-t-clay-700" />
      </div>
    )
  }

  if (!user || !isAdmin) return null

  return (
    <div className="flex min-h-screen bg-sand-50">
      <Sidebar
        mobileOpen={drawerOpen}
        onCloseMobile={() => setDrawerOpen(false)}
        email={user.email ?? undefined}
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
  )
}
