'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BadgePercent,
  Boxes,
  Building2,
  Calculator,
  CircleUserRound,
  ClipboardList,
  Cog,
  ExternalLink,
  FileText,
  Home,
  LifeBuoy,
  LogOut,
  Mailbox,
  Megaphone,
  Palette,
  Receipt,
  ScrollText,
  ShieldCheck,
  Star,
  Tag,
  Users,
  Warehouse,
} from 'lucide-react'
import { PopClose } from '@/components/ui/PopClose'
import { useLocale, useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabaseClient'

/** Initiales pour l'avatar du compte — pseudo d'abord, sinon email (local-part). */
function initials(displayName?: string, email?: string): string {
  const source = displayName?.trim() || email?.split('@')[0]
  if (!source) return 'FA'
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

type NavItem = {
  href: string
  /** Clé i18n dans Admin.sidebar.nav* */
  labelKey:
    | 'navOverview'
    | 'navAccounting'
    | 'navProducts'
    | 'navBrands'
    | 'navStock'
    | 'navTags'
    | 'navPromotions'
    | 'navReservations'
    | 'navSales'
    | 'navMessages'
    | 'navAnnounce'
    | 'navBlog'
    | 'navUsers'
    | 'navReviews'
    | 'navNewsletter'
    | 'navAppearance'
    | 'navAdmins'
    | 'navLogs'
    | 'navSettings'
  icon: React.ComponentType<{ className?: string }>
  badgeKey?: 'products' | 'low_stock' | 'reservations' | 'messages'
  badgeVariant?: 'count' | 'alert'
}

type Section = {
  /** Clé i18n dans Admin.sidebar.section* */
  titleKey:
    | 'sectionGeneral'
    | 'sectionCatalog'
    | 'sectionOps'
    | 'sectionCustomers'
    | 'sectionConfig'
    | 'sectionAccess'
  items: NavItem[]
}

const SECTIONS: Section[] = [
  {
    titleKey: 'sectionGeneral',
    items: [
      { href: '/admin', labelKey: 'navOverview', icon: Home },
      { href: '/admin/contabilidad', labelKey: 'navAccounting', icon: Calculator },
    ],
  },
  {
    titleKey: 'sectionCatalog',
    items: [
      { href: '/admin/product', labelKey: 'navProducts', icon: Boxes, badgeKey: 'products', badgeVariant: 'count' },
      { href: '/admin/marques', labelKey: 'navBrands', icon: Building2 },
      { href: '/admin/stock', labelKey: 'navStock', icon: Warehouse, badgeKey: 'low_stock', badgeVariant: 'alert' },
      { href: '/admin/tags', labelKey: 'navTags', icon: Tag },
      { href: '/admin/promotions', labelKey: 'navPromotions', icon: BadgePercent },
    ],
  },
  {
    titleKey: 'sectionOps',
    items: [
      {
        href: '/admin/reservations',
        labelKey: 'navReservations',
        icon: ClipboardList,
        badgeKey: 'reservations',
        badgeVariant: 'alert',
      },
      { href: '/admin/ventas', labelKey: 'navSales', icon: Receipt },
      { href: '/admin/messages', labelKey: 'navMessages', icon: LifeBuoy, badgeKey: 'messages', badgeVariant: 'alert' },
      { href: '/admin/annonce', labelKey: 'navAnnounce', icon: Megaphone },
      { href: '/admin/blog', labelKey: 'navBlog', icon: FileText },
    ],
  },
  {
    titleKey: 'sectionCustomers',
    items: [
      { href: '/admin/users', labelKey: 'navUsers', icon: Users },
      { href: '/admin/reviews', labelKey: 'navReviews', icon: Star },
      { href: '/admin/newsletter', labelKey: 'navNewsletter', icon: Mailbox },
    ],
  },
  {
    titleKey: 'sectionConfig',
    items: [
      { href: '/admin/settings', labelKey: 'navSettings', icon: Cog },
      { href: '/admin/apariencia', labelKey: 'navAppearance', icon: Palette },
    ],
  },
  {
    titleKey: 'sectionAccess',
    items: [
      { href: '/admin/admins', labelKey: 'navAdmins', icon: ShieldCheck },
      { href: '/admin/logs', labelKey: 'navLogs', icon: ScrollText },
    ],
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
  /** Pseudo de l'admin connecté (`profiles.display_name`) — nom affiché. */
  displayName?: string
}

export function Sidebar({ mobileOpen, onCloseMobile, email, displayName }: SidebarProps) {
  const pathname = usePathname()
  const locale = useLocale()
  const dialogId = useId()
  const [stats, setStats] = useState<Stats>({})
  const tNav = useTranslations('Admin.sidebar')
  const tChrome = useTranslations('Admin.chrome')

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/sidebar-stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setStats(d)
      })
      .catch(() => {
        // fail-quiet
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
      <div className="flex items-center gap-2 px-3 pt-1 pb-4 mb-1.5 border-b border-sand-300">
        <Link
          href="/admin"
          onClick={onCloseMobile}
          className="mr-auto font-serif text-[24px] leading-none tracking-[0.01em] text-ink-900"
        >
          FARMAU
        </Link>
        <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-clay-700 border border-clay-700/45 px-[7px] py-[3px] rounded-[5px] font-medium">
          {tChrome('adminBadge')}
        </span>
        <PopClose onClick={onCloseMobile} className="lg:hidden" label={tChrome('openMenu')} />
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
        {SECTIONS.map((section) => (
          <div key={section.titleKey}>
            <p className="px-3 pt-3.5 pb-1.5 text-[10.5px] tracking-[0.18em] uppercase text-ink-500 font-semibold">
              {tNav(section.titleKey)}
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
                    <span className="flex-1">{tNav(item.labelKey)}</span>
                    {badgeValue !== undefined && badgeValue > 0 && (
                      <span
                        className={`text-[10px] font-semibold leading-[1.4] rounded-full px-1.5 py-px ${
                          item.badgeVariant === 'alert'
                            ? 'bg-clay-700 text-on-accent'
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

      <div className="border-t border-sand-300 pt-4 mt-2 shrink-0">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] hover:bg-sand-200 transition-colors">
          <span
            aria-hidden
            className="w-[34px] h-[34px] shrink-0 rounded-full bg-clay-700 text-on-accent text-[12.5px] font-semibold tracking-[0.02em] inline-flex items-center justify-center"
          >
            {initials(displayName, email)}
          </span>
          <span className="flex flex-col min-w-0 leading-[1.35]">
            <b className="text-[13px] text-ink-900 font-semibold truncate" title={email}>
              {displayName?.trim() || (email ? email.split('@')[0] : 'FARMAU')}
            </b>
            <small className="text-[11px] text-ink-500">{tChrome('adminBadge')}</small>
          </span>
          <button
            type="button"
            onClick={handleLogout}
            title={tChrome('logout')}
            aria-label={tChrome('logout')}
            className="ml-auto w-[30px] h-[30px] shrink-0 inline-flex items-center justify-center rounded-md text-ink-500 hover:bg-sand-300 hover:text-brick-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Ponts vers le côté client : un admin reste un client (compte unique,
            deux casquettes). « Voir le site » ouvre la boutique publique ;
            « Mon compte » mène au profil/sécurité perso côté /account. */}
        <div className="mt-1 flex flex-col gap-0.5">
          <Link
            href={`/${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onCloseMobile}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-ink-700 hover:bg-sand-200 hover:text-ink-900 transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-ink-500" />
            <span className="flex-1">{tNav('viewSite')}</span>
          </Link>
          <Link
            href={`/${locale}/account/profile`}
            onClick={onCloseMobile}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-ink-700 hover:bg-sand-200 hover:text-ink-900 transition-colors"
          >
            <CircleUserRound className="w-4 h-4 shrink-0 text-ink-500" />
            <span className="flex-1">{tNav('myAccount')}</span>
          </Link>
        </div>
      </div>
    </nav>
  )

  return (
    <>
      {/* Desktop sticky : reste collé en haut de l'écran quand le main scroll */}
      <aside
        data-testid="admin-sidebar"
        className="hidden lg:flex w-[240px] shrink-0 bg-sand-100 border-r border-sand-300 px-3 py-5 sticky top-0 h-screen"
      >
        {content}
      </aside>

      {/* Mobile drawer — blurred scrim + rounded drawer */}
      <div
        aria-hidden={!mobileOpen}
        className={`lg:hidden fixed inset-0 z-40 bg-[--pop-backdrop] backdrop-blur-[14px] backdrop-saturate-[120%] transition-opacity duration-200 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
      />
      <aside
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-label="Menu admin"
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-[260px] bg-sand-100 px-3 py-5 transform transition-transform duration-200 overflow-y-auto rounded-tr-[20px] rounded-br-[20px] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          transitionTimingFunction: 'var(--pop-ease)',
          boxShadow: 'var(--pop-shadow-drawer-l)',
        }}
      >
        {content}
      </aside>
    </>
  )
}
