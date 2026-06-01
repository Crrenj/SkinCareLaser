'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import NextLink from 'next/link'
import { ShoppingBag, User as UserIcon, Heart, Menu, Shield } from 'lucide-react'
import { SiWhatsapp } from 'react-icons/si'
import { useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useCart } from '@/hooks/useCart'
import { CartDrawer } from './CartDrawer'
import { MobileDrawer } from './MobileDrawer'
import { NavSearch, type NavSearchHandle } from './NavSearch'
import { FarmauLockup } from './brand/FarmauLogo'
import { LocaleSwitcher } from './LocaleSwitcher'
import { ThemeModeToggle } from './ThemeModeToggle'

const NAV_LINKS = [
  { href: '/', labelKey: 'home' as const },
  { href: '/catalogue', labelKey: 'catalogue' as const },
  { href: '/marques', labelKey: 'brands' as const },
  { href: '/blog', labelKey: 'blog' as const },
  { href: '/a-propos', labelKey: 'about' as const },
]

export default function NavBar() {
  const t = useTranslations('Nav')
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAdmin } = useIsAdmin()
  const { totalItems } = useCart()

  const [cartOpen, setCartOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const searchRefDesktop = useRef<NavSearchHandle>(null)
  const searchRefMobile = useRef<NavSearchHandle>(null)

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/')
  }, [router])

  // ⌘K / Ctrl+K → focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const target = window.innerWidth >= 1024 ? searchRefDesktop.current : searchRefMobile.current
        target?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-40 bg-sand-50/85 backdrop-blur-md border-b border-sand-300">
      {/* ── Utility row (≥ lg uniquement) ── */}
      <div className="hidden lg:flex items-center justify-between bg-sand-100/50 border-b border-sand-200 px-6 py-1.5 text-[11px] text-ink-700">
        <div className="flex items-center gap-3">
          <Link href="/contact" className="hover:text-ink-900 transition-colors">
            {t('utility.delivery')}
          </Link>
          <span className="text-ink-500">·</span>
          <Link href="/a-propos" className="hover:text-ink-900 transition-colors">
            {t('utility.pharmacists')}
          </Link>
          <span className="text-ink-500">·</span>
          <Link href="/contact" className="hover:text-ink-900 transition-colors">
            {t('utility.help')}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher variant="inline" />
        </div>
      </div>

      {/* ── Main row (logo + actions) ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 lg:gap-8 px-4 lg:px-6 py-3 lg:py-4">
        {/* Gauche : burger (mobile) + actions compte/favoris (desktop) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('menuAriaLabel')}
            className="lg:hidden h-10 w-10 flex items-center justify-center text-ink-800 rounded hover:bg-sand-100 transition-colors"
          >
            <Menu size={22} strokeWidth={1.6} />
          </button>
          <div className="hidden lg:flex items-center gap-1.5">
            <IconLinkButton
              href={user ? '/account/profile' : '/login'}
              icon={<UserIcon size={22} strokeWidth={1.6} />}
              label={t('myAccountAriaLabel')}
            />
            <IconLinkButton
              href="/favoris"
              icon={<Heart size={22} strokeWidth={1.6} />}
              label={t('favoritesAriaLabel')}
            />
          </div>
        </div>

        {/* Centre : Logo */}
        <div className="flex justify-center">
          <FarmauLockup birdSize={46} wordWidth={78} />
        </div>

        {/* Droite : thème + WhatsApp (≥ md) + admin + panier */}
        <div className="flex items-center justify-end gap-1.5">
          <ThemeModeToggle variant="nav" />
          <a
            href="https://wa.me/18094122468"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('whatsappAriaLabel')}
            className="hidden md:inline-flex h-10 w-10 items-center justify-center text-ink-800 rounded hover:bg-sand-100 transition-colors"
          >
            <SiWhatsapp size={22} />
          </a>
          {isAdmin && (
            <IconLinkButton
              href="/admin/product"
              icon={<Shield size={22} strokeWidth={1.6} />}
              label={t('adminDashboardAriaLabel')}
              className="hidden md:inline-flex"
              localized={false}
            />
          )}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={t('cartAriaLabel')}
            className="relative h-10 w-10 flex items-center justify-center text-ink-800 rounded hover:bg-sand-100 transition-colors"
            data-testid="cart-icon"
          >
            <ShoppingBag size={22} strokeWidth={1.6} />
            {totalItems > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-clay-700 text-sand-50 text-[10px] font-semibold flex items-center justify-center"
                data-testid="cart-badge"
              >
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Nav + Search row (≥ lg) ── */}
      <div className="hidden lg:flex items-center gap-8 px-6 py-3 border-t border-sand-200">
        <nav className="flex items-center gap-1" aria-label={t('mainNavAriaLabel')}>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              active={pathname === link.href}
              label={t(link.labelKey)}
            />
          ))}
        </nav>
        <NavSearch ref={searchRefDesktop} className="ml-auto max-w-[520px] flex-1" />
      </div>

      {/* ── Search row mobile (< lg) ── */}
      <div className="lg:hidden px-4 pb-3">
        <NavSearch ref={searchRefMobile} className="w-full" />
      </div>

      {/* Drawers */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
      />
    </header>
  )
}

function NavLink({
  href,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <Link
      href={href}
      className={`relative px-3 py-2 text-[15px] -tracking-[0.005em] rounded-sm transition-colors ${
        active ? 'text-ink-900 font-semibold' : 'text-ink-800 font-medium hover:text-ink-900'
      }`}
    >
      {label}
      <span
        aria-hidden
        className={`absolute left-3 right-3 bottom-0.5 h-[2px] origin-left transition-transform duration-200 ${
          active ? 'scale-x-100 bg-clay-700' : 'scale-x-0 bg-ink-900'
        }`}
      />
    </Link>
  )
}

function IconLinkButton({
  href,
  icon,
  label,
  className = '',
  localized = true,
}: {
  href: string
  icon: React.ReactNode
  label: string
  className?: string
  /** false → lien NON préfixé par la locale (routes /admin/* hors [locale]). */
  localized?: boolean
}) {
  const cls = `h-10 w-10 inline-flex items-center justify-center text-ink-800 rounded hover:bg-sand-100 transition-colors ${className}`
  // Les routes /admin/* ne vivent pas sous [locale] : le Link next-intl les
  // préfixerait (`/fr/admin/...` → 404). On utilise next/link brut pour elles.
  if (!localized) {
    return (
      <NextLink href={href} aria-label={label} className={cls}>
        {icon}
      </NextLink>
    )
  }
  return (
    <Link href={href} aria-label={label} className={cls}>
      {icon}
    </Link>
  )
}
