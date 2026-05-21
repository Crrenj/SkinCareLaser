'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Boxes,
  Building2,
  ClipboardList,
  Cog,
  Home,
  LogOut,
  Mail,
  Mailbox,
  Megaphone,
  Tag,
  Users,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  /** clé du badge dans /api/admin/sidebar-stats (optionnel). */
  badgeKey?: 'products' | 'low_stock' | 'reservations' | 'messages'
  /** Style du badge : `count` = neutre ink-500, `alert` = clay-700. */
  badgeVariant?: 'count' | 'alert'
}

type Section = {
  title: string
  items: NavItem[]
}

const SECTIONS: Section[] = [
  {
    title: 'General',
    items: [{ href: '/admin', label: 'Vista general', icon: Home }],
  },
  {
    title: 'Catálogo',
    items: [
      { href: '/admin/product', label: 'Productos', icon: Boxes, badgeKey: 'products', badgeVariant: 'count' },
      { href: '/admin/marques', label: 'Marcas', icon: Building2 },
      { href: '/admin/stock', label: 'Stock', icon: Boxes, badgeKey: 'low_stock', badgeVariant: 'alert' },
      { href: '/admin/tags', label: 'Etiquetas', icon: Tag },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      {
        href: '/admin/reservations',
        label: 'Reservas',
        icon: ClipboardList,
        badgeKey: 'reservations',
        badgeVariant: 'alert',
      },
      { href: '/admin/messages', label: 'Mensajes', icon: Mail, badgeKey: 'messages', badgeVariant: 'alert' },
      { href: '/admin/annonce', label: 'Anuncios', icon: Megaphone },
    ],
  },
  {
    title: 'Clientes',
    items: [
      { href: '/admin/users', label: 'Usuarios', icon: Users },
      { href: '/admin/newsletter', label: 'Newsletter', icon: Mailbox },
    ],
  },
  {
    title: 'Cuenta',
    items: [{ href: '/admin/settings', label: 'Configuración', icon: Cog }],
  },
]

type Stats = {
  products?: number
  low_stock?: number
  reservations?: number
  messages?: number
}

type SidebarProps = {
  mobileOpen: boolean
  onCloseMobile: () => void
  email?: string
}

export function Sidebar({ mobileOpen, onCloseMobile, email }: SidebarProps) {
  const pathname = usePathname()
  const dialogId = useId()
  const [stats, setStats] = useState<Stats>({})

  // Charge les compteurs sidebar via une route service-role
  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/sidebar-stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setStats(d)
      })
      .catch(() => {
        // fail-quiet : badges juste absents
      })
    return () => {
      cancelled = true
    }
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Esc ferme le drawer mobile
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [mobileOpen, onCloseMobile])

  const content = (
    <nav className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between px-3 pb-4 mb-1 border-b border-sand-300">
        <Link
          href="/admin"
          className="font-serif text-[24px] tracking-[0.01em] text-ink-900"
          onClick={onCloseMobile}
        >
          FARMAU
        </Link>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden w-8 h-8 rounded-md text-ink-700 hover:bg-sand-200 flex items-center justify-center"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 pt-3.5 pb-1.5 text-[10.5px] tracking-[0.18em] uppercase text-ink-500 font-semibold">
              {section.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href)
                const badgeValue = item.badgeKey ? stats[item.badgeKey] : undefined
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] border-l-2 transition-colors ${
                      isActive
                        ? 'bg-sand-200 text-ink-900 font-medium border-l-clay-700'
                        : 'text-ink-700 border-l-transparent hover:bg-sand-200 hover:text-ink-900'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-clay-700' : 'text-ink-500'
                      }`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {badgeValue !== undefined && badgeValue > 0 && (
                      <span
                        className={`text-[10px] font-semibold leading-[1.4] rounded-full px-1.5 py-px ${
                          item.badgeVariant === 'alert'
                            ? 'bg-clay-700 text-sand-50'
                            : 'bg-ink-500 text-sand-50'
                        }`}
                      >
                        {badgeValue > 99 ? '99+' : badgeValue}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-sand-300 pt-3 mt-2 flex flex-col gap-0.5">
        {email && (
          <p className="px-3 pt-1 text-[11px] text-ink-500 truncate" title={email}>
            {email}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] text-brick-600 hover:bg-brick-600/10 transition-colors text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </nav>
  )

  return (
    <>
      {/* Desktop static */}
      <aside className="hidden lg:flex w-[240px] shrink-0 bg-sand-100 border-r border-sand-300 px-3 py-5">
        {content}
      </aside>

      {/* Mobile drawer */}
      <div
        aria-hidden={!mobileOpen}
        className={`lg:hidden fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm transition-opacity duration-200 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
      />
      <aside
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-label="Menu admin"
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-[240px] bg-sand-100 border-r border-sand-300 px-3 py-5 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-y-auto`}
      >
        {content}
      </aside>
    </>
  )
}
