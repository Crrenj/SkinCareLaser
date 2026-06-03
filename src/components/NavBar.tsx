'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import NextLink from 'next/link'
import {
  Search,
  ShoppingBag,
  User as UserIcon,
  Menu,
  ChevronDown,
  ArrowRight,
  Check,
  Heart,
  CalendarCheck,
  Truck,
  HelpCircle,
  Shield,
  LogIn,
  LogOut,
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { supabase } from '@/lib/supabaseClient'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useCart } from '@/hooks/useCart'
import { CartDrawer } from './CartDrawer'
import { MobileDrawer } from './MobileDrawer'
import { SearchOverlay } from './nav/SearchOverlay'
import { ScrollToTop } from './nav/ScrollToTop'
import { FarmauLockup } from './brand/FarmauLogo'
import { ThemeModeToggle } from './ThemeModeToggle'

// ── Contenu des menus (routes réelles vérifiées en base) ──
// `count` = nombre de produits indicatif (catalogue courant), repris du design.
const SKIN_TYPES = [
  { key: 'sensitive', slug: 'sensible', count: 29 },
  { key: 'oily', slug: 'grasse', count: 43 },
  { key: 'dry', slug: 'seche', count: 25 },
  { key: 'atopic', slug: 'atopique', count: 23 },
] as const

const MEGA_BRANDS = [
  { name: 'Avène', slug: 'avene', count: 32 },
  { name: 'ISDIN', slug: 'isdin', count: 29 },
  { name: 'Filorga', slug: 'filorga', count: 32 },
  { name: 'Uriage', slug: 'uriage', count: 30 },
] as const

const NEEDS = [
  { key: 'hydration', slug: 'hydratation', dot: 'bg-clay-400', count: 92 },
  { key: 'antiAge', slug: 'anti-age', dot: 'bg-clay-700', count: 71 },
  { key: 'sun', slug: 'protection-solaire', dot: 'bg-olive-600', count: 58 },
  { key: 'acne', slug: 'acne', dot: 'bg-ink-400', count: 52 },
  { key: 'spots', slug: 'taches', dot: 'bg-brick-600', count: 43 },
] as const

const LOCALE_NAMES: Record<string, string> = { es: 'Español', en: 'English', fr: 'Français' }

type MenuId = 'catalogo' | 'needs' | 'lang' | 'account'

const PANEL_BASE =
  'absolute top-[calc(100%+10px)] z-[70] rounded-[14px] border border-sand-300 bg-sand-50 ' +
  'shadow-[0_24px_60px_-18px_rgba(31,27,22,0.28),0_8px_16px_-8px_rgba(31,27,22,0.10)] ' +
  'transition-[opacity,transform,visibility] duration-200'

function panelCls(open: boolean, extra: string) {
  return `${PANEL_BASE} ${extra} ${
    open
      ? 'visible translate-y-0 opacity-100'
      : 'pointer-events-none invisible -translate-y-1.5 opacity-0'
  }`
}

export default function NavBar() {
  const t = useTranslations('Nav')
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const { user, isAdmin } = useIsAdmin()
  const { totalItems } = useCart()
  const [, startTransition] = useTransition()

  const [openMenu, setOpenMenu] = useState<MenuId | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const headerRef = useRef<HTMLElement>(null)

  const toggleMenu = (id: MenuId) => setOpenMenu((cur) => (cur === id ? null : id))
  const openSearch = () => {
    setOpenMenu(null)
    setSearchOpen(true)
  }

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    setOpenMenu(null)
    router.push('/')
  }, [router])

  const switchLocale = useCallback(
    (target: string) => {
      setOpenMenu(null)
      if (target === locale) return
      startTransition(() => {
        router.replace(pathname, { locale: target as (typeof routing.locales)[number] })
      })
    },
    [locale, pathname, router],
  )

  // Ferme le menu ouvert sur clic hors d'un conteneur de menu.
  useEffect(() => {
    if (!openMenu) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target?.closest('[data-nav-menu]')) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openMenu])

  // Ferme tout à chaque navigation.
  useEffect(() => {
    setOpenMenu(null)
    setSearchOpen(false)
  }, [pathname])

  // Esc ferme les menus ; ⌘K / Ctrl+K bascule la recherche.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null)
        setSearchOpen(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpenMenu(null)
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const meta = (user?.user_metadata ?? {}) as Record<string, string | null | undefined>
  const fullName = [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim()
  const displayName = fullName || user?.email?.split('@')[0] || ''
  const initial = (fullName || user?.email || '?').trim().charAt(0).toUpperCase()

  const catalogoActive = pathname.startsWith('/catalogue')
  const needsActive = pathname.startsWith('/besoins')

  return (
    <>
    <header
      ref={headerRef}
      className="relative z-40 border-b border-sand-300 bg-sand-50/[0.88] backdrop-blur-[14px] backdrop-saturate-[1.4]"
    >
      <div className="mx-auto flex h-[70px] max-w-[1440px] items-center gap-2.5 px-[clamp(20px,5vw,72px)]">
        {/* Brand */}
        <FarmauLockup birdSize={46} wordWidth={64} className="mr-3 shrink-0" />

        {/* Liens primaires (desktop) */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t('mainNavAriaLabel')}>
          {/* Catálogo · méga-menu */}
          <div className="relative" data-nav-menu>
            <MenuTrigger
              label={t('catalogue')}
              open={openMenu === 'catalogo'}
              active={catalogoActive}
              onClick={() => toggleMenu('catalogo')}
            />
            <div className={panelCls(openMenu === 'catalogo', 'left-0 grid w-[660px] grid-cols-[1fr_1fr_200px] gap-x-7 gap-y-2 p-[22px]')} role="menu">
              {/* Col 1 · Type de peau */}
              <div>
                <div className="px-2.5 pb-2 pt-1 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-500">
                  {t('mega.skinTypeHeading')}
                </div>
                {SKIN_TYPES.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/catalogue?tag=types-peau:${s.slug}`}
                    className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[13.5px] text-ink-800 transition-colors hover:bg-sand-100 hover:text-ink-900"
                  >
                    {t(`mega.skinTypes.${s.key}`)}
                    <span className="font-mono text-[10.5px] text-ink-400">{s.count}</span>
                  </Link>
                ))}
              </div>
              {/* Col 2 · Marques */}
              <div>
                <div className="px-2.5 pb-2 pt-1 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-500">
                  {t('mega.brandsHeading')}
                </div>
                {MEGA_BRANDS.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/marques/${b.slug}`}
                    className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[13.5px] text-ink-800 transition-colors hover:bg-sand-100 hover:text-ink-900"
                  >
                    {b.name}
                    <span className="font-mono text-[10.5px] text-ink-400">{b.count}</span>
                  </Link>
                ))}
                <Link
                  href="/marques"
                  className="mt-1 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold text-clay-700 transition-colors hover:bg-sand-100"
                >
                  {t('mega.allBrands')}
                  <ArrowRight size={13} strokeWidth={2} />
                </Link>
              </div>
              {/* Col 3 · Encart sélection */}
              <Link
                href="/besoins/protection-solaire"
                className="relative col-start-3 flex min-h-[230px] flex-col justify-end overflow-hidden rounded-[11px] border border-sand-300 bg-gradient-to-br from-clay-50 to-sand-100 p-4"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 opacity-50"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(135deg,transparent 0 11px,color-mix(in srgb,var(--color-clay-200) 50%,transparent) 11px 12px)',
                  }}
                />
                <span className="relative font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-clay-700">
                  {t('mega.featuredTag')}
                </span>
                <span className="relative my-1.5 mb-2.5 font-serif text-[23px] leading-[1.05] text-ink-900">
                  {t('mega.featuredTitle')}
                </span>
                <span className="relative inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-clay-700">
                  {t('mega.featuredCta')} <ArrowRight size={13} strokeWidth={2} />
                </span>
              </Link>
            </div>
          </div>

          {/* Necesidades · liste */}
          <div className="relative" data-nav-menu>
            <MenuTrigger
              label={t('needs')}
              open={openMenu === 'needs'}
              active={needsActive}
              onClick={() => toggleMenu('needs')}
            />
            <div className={panelCls(openMenu === 'needs', 'left-0 w-[280px] p-2')} role="menu">
              {NEEDS.map((n) => (
                <Link
                  key={n.slug}
                  href={`/besoins/${n.slug}`}
                  className="flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[13.5px] text-ink-800 transition-colors hover:bg-sand-100 hover:text-ink-900"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${n.dot}`} />
                  {t(`needsMenu.${n.key}`)}
                  <span className="ml-auto font-mono text-[10px] text-ink-400">{n.count}</span>
                </Link>
              ))}
            </div>
          </div>

          <PlainLink href="/marques" label={t('brands')} active={pathname.startsWith('/marques')} />
          <PlainLink href="/blog" label={t('blog')} active={pathname.startsWith('/blog')} />
        </nav>

        {/* Cluster droit */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={openSearch}
            aria-label={t('search')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[9px] text-ink-700 transition-colors hover:bg-sand-100 hover:text-ink-900"
          >
            <Search size={19} strokeWidth={1.7} />
          </button>

          <ThemeModeToggle variant="nav" />

          {/* Langue (desktop) */}
          <div className="relative hidden lg:block" data-nav-menu>
            <button
              type="button"
              onClick={() => toggleMenu('lang')}
              aria-haspopup="menu"
              aria-expanded={openMenu === 'lang'}
              aria-label={t('languageSelectAriaLabel')}
              className={`inline-flex h-10 items-center gap-1.5 rounded-[9px] px-[11px] text-[12.5px] font-semibold tracking-[0.04em] transition-colors hover:bg-sand-100 hover:text-ink-900 ${
                openMenu === 'lang' ? 'bg-sand-100 text-ink-900' : 'text-ink-700'
              }`}
            >
              {locale.toUpperCase()}
              <ChevronDown
                size={12}
                strokeWidth={1.9}
                className={`opacity-70 transition-transform ${openMenu === 'lang' ? 'rotate-180' : ''}`}
              />
            </button>
            <div className={panelCls(openMenu === 'lang', 'right-0 w-[170px] p-1.5')} role="menu">
              {routing.locales.map((loc) => {
                const selected = loc === locale
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => switchLocale(loc)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-sand-100 ${
                      selected ? 'font-semibold text-ink-900' : 'text-ink-800'
                    }`}
                  >
                    <span className="flex items-baseline gap-1.5">
                      {LOCALE_NAMES[loc] ?? loc}
                      <span className="font-mono text-[10px] font-normal text-ink-400">
                        {loc.toUpperCase()}
                      </span>
                    </span>
                    {selected && <Check size={14} strokeWidth={2.2} className="text-clay-700" />}
                  </button>
                )
              })}
            </div>
          </div>

          <span className="mx-1 hidden h-[26px] w-px bg-sand-300 lg:block" />

          {/* Compte (desktop) */}
          <div className="relative hidden lg:block" data-nav-menu>
            <button
              type="button"
              onClick={() => toggleMenu('account')}
              aria-haspopup="menu"
              aria-expanded={openMenu === 'account'}
              aria-label={t('myAccountAriaLabel')}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-[9px] transition-colors hover:bg-sand-100 hover:text-ink-900 ${
                openMenu === 'account' ? 'bg-sand-100 text-ink-900' : 'text-ink-700'
              }`}
            >
              <UserIcon size={19} strokeWidth={1.7} />
            </button>
            <div className={panelCls(openMenu === 'account', 'right-0 w-[248px] p-2')} role="menu">
              {user ? (
                <>
                  <div className="mb-1.5 flex items-center gap-3 border-b border-sand-200 px-3 pb-2.5 pt-3">
                    <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-clay-700 text-sm font-semibold text-sand-50">
                      {initial}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-semibold text-ink-900">
                        {displayName}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-500">{user.email}</span>
                    </span>
                  </div>
                  <AccountLink href="/account/reservations" icon={<CalendarCheck size={16} strokeWidth={1.7} />} label={t('account.reservations')} />
                  <AccountLink href="/favoris" icon={<Heart size={16} strokeWidth={1.7} />} label={t('account.favorites')} />
                  {isAdmin && (
                    <AccountLink href="/admin/product" localized={false} icon={<Shield size={16} strokeWidth={1.7} />} label={t('adminDashboardAriaLabel')} />
                  )}
                  <div className="mx-2 my-1.5 h-px bg-sand-200" />
                  <AccountLink href="/livraison" icon={<Truck size={16} strokeWidth={1.7} />} label={t('utility.delivery')} />
                  <AccountLink href="/contact" icon={<HelpCircle size={16} strokeWidth={1.7} />} label={t('account.help')} />
                  <div className="mx-2 my-1.5 h-px bg-sand-200" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-ink-800 transition-colors hover:bg-sand-100 hover:text-ink-900"
                  >
                    <LogOut size={16} strokeWidth={1.7} className="text-ink-500" />
                    {t('signOut')}
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-1.5 border-b border-sand-200 px-3 pb-2.5 pt-2.5">
                    <p className="text-[13.5px] font-semibold text-ink-900">{t('account.signedOutTitle')}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-ink-500">
                      {t('account.signedOutSubtitle')}
                    </p>
                  </div>
                  <AccountLink href="/favoris" icon={<Heart size={16} strokeWidth={1.7} />} label={t('account.favorites')} />
                  <AccountLink href="/livraison" icon={<Truck size={16} strokeWidth={1.7} />} label={t('utility.delivery')} />
                  <AccountLink href="/contact" icon={<HelpCircle size={16} strokeWidth={1.7} />} label={t('account.help')} />
                  <div className="p-2 pt-1.5">
                    <Link
                      href="/login"
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-[9px] bg-ink-900 text-[13px] font-medium text-sand-50 transition-colors hover:bg-clay-800"
                    >
                      <LogIn size={15} strokeWidth={1.8} />
                      {t('signIn')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Panier */}
          <button
            type="button"
            onClick={() => setCartOpen((o) => !o)}
            aria-label={t('cartAriaLabel')}
            data-testid="cart-icon"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-[9px] text-ink-700 transition-colors hover:bg-sand-100 hover:text-ink-900"
          >
            <ShoppingBag size={19} strokeWidth={1.7} />
            {totalItems > 0 && (
              <span
                data-testid="cart-badge"
                className="absolute right-1 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-[1.5px] border-sand-50 bg-clay-700 px-1 text-[10px] font-semibold leading-none text-sand-50"
              >
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>

          {/* CTA Reservar (desktop) */}
          <Link
            href="/cart"
            className="group ml-1 hidden h-10 items-center gap-2 rounded-[9px] bg-ink-900 px-[17px] text-[13px] font-medium text-sand-50 transition-colors hover:bg-clay-800 lg:inline-flex"
          >
            {t('reserve')}
            <ArrowRight size={15} strokeWidth={1.9} className="transition-transform group-hover:translate-x-[3px]" />
          </Link>

          {/* Burger (mobile) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('menuAriaLabel')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[9px] text-ink-800 transition-colors hover:bg-sand-100 lg:hidden"
          >
            <Menu size={22} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>

      {/* Overlays / drawers — rendus HORS du <header> : son backdrop-filter
          en fait un bloc conteneur pour les position:fixed, ce qui débordait
          le drawer panier à droite (scroll horizontal) et limitait le scrim
          aux 70px du header (clic-pour-fermer mort). En frères du header, ils
          se positionnent enfin par rapport au viewport. */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
      />
      <ScrollToTop headerRef={headerRef} />
    </>
  )
}

function MenuTrigger({
  label,
  open,
  active,
  onClick,
}: {
  label: string
  open: boolean
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="menu"
      aria-expanded={open}
      className={`relative inline-flex items-center gap-1.5 rounded-[7px] px-[13px] py-[9px] text-[13.5px] font-medium tracking-[0.01em] transition-colors hover:bg-sand-100 hover:text-ink-900 ${
        open || active ? 'text-ink-900' : 'text-ink-700'
      } ${open ? 'bg-sand-100' : ''}`}
    >
      {label}
      <ChevronDown
        size={13}
        strokeWidth={1.8}
        className={`opacity-70 transition-transform ${open ? 'rotate-180' : ''}`}
      />
      {active && (
        <span aria-hidden className="absolute inset-x-[13px] bottom-[3px] h-[2px] rounded-full bg-clay-700" />
      )}
    </button>
  )
}

function PlainLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`relative inline-flex items-center rounded-[7px] px-[13px] py-[9px] text-[13.5px] font-medium tracking-[0.01em] transition-colors hover:bg-sand-100 hover:text-ink-900 ${
        active ? 'text-ink-900' : 'text-ink-700'
      }`}
    >
      {label}
      {active && (
        <span aria-hidden className="absolute inset-x-[13px] bottom-[3px] h-[2px] rounded-full bg-clay-700" />
      )}
    </Link>
  )
}

function AccountLink({
  href,
  icon,
  label,
  localized = true,
}: {
  href: string
  icon: React.ReactNode
  label: string
  localized?: boolean
}) {
  const cls =
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-ink-800 transition-colors hover:bg-sand-100 hover:text-ink-900 [&_svg]:text-ink-500'
  if (!localized) {
    // Routes /admin/* hors [locale] : next/link brut (le Link next-intl
    // préfixerait → /fr/admin/... → 404).
    return (
      <NextLink href={href} className={cls}>
        {icon}
        {label}
      </NextLink>
    )
  }
  return (
    <Link href={href} className={cls}>
      {icon}
      {label}
    </Link>
  )
}
