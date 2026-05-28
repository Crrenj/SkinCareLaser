'use client'

import { ChevronRight, User as UserIcon, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { User } from '@supabase/supabase-js'
import { Link, usePathname } from '@/i18n/navigation'
import { useModalA11y } from '@/hooks/useModalA11y'
import { FarmauLockup } from './brand/FarmauLogo'
import { LocaleSwitcher } from './LocaleSwitcher'
import { PopClose } from '@/components/ui/PopClose'

const NAV_LINKS = [
  { href: '/', labelKey: 'home' as const },
  { href: '/catalogue', labelKey: 'catalogue' as const },
  { href: '/a-propos', labelKey: 'about' as const },
]

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  user: User | null
  isAdmin: boolean
  onSignOut: () => void
}

export function MobileDrawer({
  open,
  onClose,
  user,
  isAdmin,
  onSignOut,
}: MobileDrawerProps) {
  const t = useTranslations('Nav')
  const pathname = usePathname()
  const dialogRef = useModalA11y<HTMLElement>(open, onClose)

  if (!open) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      {/* Scrim — blurred backdrop */}
      <button
        type="button"
        aria-label={t('closeMenuAriaLabel')}
        onClick={onClose}
        className="absolute inset-0 bg-[--pop-backdrop] backdrop-blur-[14px] backdrop-saturate-[120%]"
      />

      {/* Drawer — rounded on right side */}
      <aside
        ref={dialogRef}
        className="absolute top-0 left-0 h-full w-[320px] max-w-[85vw] bg-sand-50 flex flex-col overflow-hidden rounded-tr-[20px] rounded-br-[20px]"
        style={{ boxShadow: 'var(--pop-shadow-drawer-l)' }}
        role="dialog"
        aria-modal="true"
        aria-label={t('drawer.menuHeading')}
        tabIndex={-1}
      >
        {/* Header — lockup monochrome */}
        <div className="flex items-center justify-between px-5 py-[18px]">
          <FarmauLockup onClick={onClose} birdSize={40} wordWidth={66} />
          <PopClose onClick={onClose} label={t('closeMenuAriaLabel')} />
        </div>

        {/* Main nav — serif links with hover bg */}
        <nav className="flex-1 px-4 py-3 flex flex-col gap-1 overflow-y-auto">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center justify-between py-3 px-[14px] font-serif text-[22px] -tracking-[0.01em] rounded-[10px] leading-[1.1] transition-colors ${
                  active
                    ? 'text-clay-700 bg-clay-50'
                    : 'text-ink-900 hover:bg-sand-100'
                }`}
              >
                {t(link.labelKey)}
                <ChevronRight size={16} strokeWidth={1.5} className="opacity-55" />
              </Link>
            )
          })}

          {/* Service section */}
          <div className="mt-2">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-ink-500 font-semibold px-[14px] py-[14px] pb-[6px]">
              {t('drawer.serviceHeading')}
            </div>
            <Link
              href="/livraison"
              onClick={onClose}
              className="block px-[14px] py-2 text-[13.5px] text-ink-700 rounded-lg hover:bg-sand-100 hover:text-ink-900"
            >
              {t('utility.delivery')}
            </Link>
            <Link
              href="/pharmacie"
              onClick={onClose}
              className="block px-[14px] py-2 text-[13.5px] text-ink-700 rounded-lg hover:bg-sand-100 hover:text-ink-900"
            >
              {t('utility.pharmacists')}
            </Link>
            <Link
              href="/contact"
              onClick={onClose}
              className="block px-[14px] py-2 text-[13.5px] text-ink-700 rounded-lg hover:bg-sand-100 hover:text-ink-900"
            >
              {t('utility.help')}
            </Link>
          </div>

          {/* Language switcher */}
          <div className="mt-2 px-[14px]">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-ink-500 font-semibold mb-2 pt-3">
              {t('languageLabel')}
            </div>
            <LocaleSwitcher variant="block" onBeforeSwitch={onClose} />
          </div>
        </nav>

        {/* Footer — distinct sand-100 zone */}
        <div className="px-5 py-5 bg-sand-100 flex flex-col gap-2.5">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin/product"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3.5 py-2.5 bg-sand-50 border border-sand-200 rounded-[10px] text-sm font-medium text-ink-900"
                >
                  <Shield size={18} strokeWidth={1.5} className="text-ink-700" />
                  {t('adminDashboardAriaLabel')}
                </Link>
              )}
              <Link
                href="/account/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-2.5 bg-sand-50 border border-sand-200 rounded-[10px] text-sm font-medium text-ink-900"
              >
                <UserIcon size={18} strokeWidth={1.5} className="text-ink-700" />
                {t('drawer.myAccountCta')}
              </Link>
              <button
                type="button"
                onClick={() => {
                  onSignOut()
                  onClose()
                }}
                className="text-left px-3.5 py-2 text-[11px] text-ink-500 underline underline-offset-[3px] hover:text-brick-600"
              >
                {t('signOut')}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-2.5 bg-sand-50 border border-sand-200 rounded-[10px] text-sm font-medium text-ink-900"
            >
              <UserIcon size={18} strokeWidth={1.5} className="text-ink-700" />
              {t('drawer.loginCta')}
            </Link>
          )}
        </div>
      </aside>
    </div>
  )
}
