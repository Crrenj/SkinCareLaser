'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Boxes,
  Building2,
  ClipboardList,
  Cog,
  FileText,
  Globe,
  Home,
  LogOut,
  Mail,
  Mailbox,
  Megaphone,
  Palette,
  Tag,
  Users,
} from 'lucide-react'
import { PopClose } from '@/components/ui/PopClose'
import { useLocale, useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabaseClient'

const ADMIN_LOCALES = [
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
] as const

type NavItem = {
  href: string
  /** Clé i18n dans Admin.sidebar.nav* */
  labelKey:
    | 'navOverview'
    | 'navProducts'
    | 'navBrands'
    | 'navStock'
    | 'navTags'
    | 'navReservations'
    | 'navMessages'
    | 'navAnnounce'
    | 'navBlog'
    | 'navUsers'
    | 'navNewsletter'
    | 'navAppearance'
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
    | 'sectionPersonalization'
    | 'sectionAccount'
  items: NavItem[]
}

const SECTIONS: Section[] = [
  {
    titleKey: 'sectionGeneral',
    items: [{ href: '/admin', labelKey: 'navOverview', icon: Home }],
  },
  {
    titleKey: 'sectionCatalog',
    items: [
      { href: '/admin/product', labelKey: 'navProducts', icon: Boxes, badgeKey: 'products', badgeVariant: 'count' },
      { href: '/admin/marques', labelKey: 'navBrands', icon: Building2 },
      { href: '/admin/stock', labelKey: 'navStock', icon: Boxes, badgeKey: 'low_stock', badgeVariant: 'alert' },
      { href: '/admin/tags', labelKey: 'navTags', icon: Tag },
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
      { href: '/admin/messages', labelKey: 'navMessages', icon: Mail, badgeKey: 'messages', badgeVariant: 'alert' },
      { href: '/admin/annonce', labelKey: 'navAnnounce', icon: Megaphone },
      { href: '/admin/blog', labelKey: 'navBlog', icon: FileText },
    ],
  },
  {
    titleKey: 'sectionCustomers',
    items: [
      { href: '/admin/users', labelKey: 'navUsers', icon: Users },
      { href: '/admin/newsletter', labelKey: 'navNewsletter', icon: Mailbox },
    ],
  },
  {
    titleKey: 'sectionPersonalization',
    items: [{ href: '/admin/apariencia', labelKey: 'navAppearance', icon: Palette }],
  },
  {
    titleKey: 'sectionAccount',
    items: [{ href: '/admin/settings', labelKey: 'navSettings', icon: Cog }],
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
  const router = useRouter()
  const dialogId = useId()
  const [stats, setStats] = useState<Stats>({})
  const [localeSwitching, setLocaleSwitching] = useState(false)
  const currentLocale = useLocale()
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

  const switchLocale = async (locale: string) => {
    if (locale === currentLocale || localeSwitching) return
    setLocaleSwitching(true)
    try {
      const res = await fetch('/api/admin/set-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLocaleSwitching(false)
    }
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
      <div className="flex items-start justify-between px-3 pb-4 mb-1 border-b border-sand-300">
        <div>
          <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium">
            Admin
          </span>
          <Link
            href="/admin"
            className="block font-serif text-[22px] tracking-[-.01em] text-ink-900 mt-1.5"
            onClick={onCloseMobile}
          >
            FARMAU
          </Link>
        </div>
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

      <div className="border-t border-sand-300 pt-3 mt-2 flex flex-col gap-1.5 shrink-0">
        <div className="px-3 flex items-center gap-2 text-[11px] text-ink-500">
          <Globe className="w-3 h-3 shrink-0" aria-hidden />
          <span className="tracking-[0.14em] uppercase font-semibold">
            {tChrome('localeGroupLabel')}
          </span>
        </div>
        <div
          className="px-3 flex gap-1.5"
          role="group"
          aria-label={tChrome('localeSwitcherAria')}
        >
          {ADMIN_LOCALES.map((loc) => {
            const isCurrent = loc.code === currentLocale
            return (
              <button
                key={loc.code}
                type="button"
                onClick={() => switchLocale(loc.code)}
                disabled={localeSwitching || isCurrent}
                aria-pressed={isCurrent}
                className={`flex-1 inline-flex items-center justify-center px-2 py-1.5 text-[12px] font-mono font-medium border rounded-md transition-colors disabled:cursor-default ${
                  isCurrent
                    ? 'bg-ink-900 text-sand-50 border-ink-900'
                    : 'bg-sand-50 text-ink-700 border-sand-300 hover:border-ink-900 hover:text-ink-900 hover:bg-sand-200'
                } ${localeSwitching && !isCurrent ? 'opacity-50' : ''}`}
              >
                {loc.label}
              </button>
            )
          })}
        </div>
        {email && (
          <p className="px-3 pt-1.5 text-[11px] text-ink-500 truncate" title={email}>
            {email}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] text-brick-600 hover:bg-brick-600/10 transition-colors text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {tChrome('logout')}
        </button>
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
