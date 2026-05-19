'use client'

import { useEffect } from 'react'
import { X, ChevronRight, User as UserIcon, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { User } from '@supabase/supabase-js'
import { Link, usePathname } from '@/i18n/navigation'
import Logo from './Logo'

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

  // Lock scroll quand le drawer est ouvert.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      {/* Overlay */}
      <button
        type="button"
        aria-label={t('closeMenuAriaLabel')}
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
      />

      {/* Drawer */}
      <aside
        className="absolute top-0 left-0 h-full w-[320px] max-w-[85vw] bg-sand-50 flex flex-col shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={t('drawer.menuHeading')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-200">
          <Logo size={48} onClick={onClose} />
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeMenuAriaLabel')}
            className="w-9 h-9 flex items-center justify-center text-ink-800 hover:bg-sand-100 rounded-sm"
          >
            <X size={22} strokeWidth={1.6} />
          </button>
        </div>

        {/* Main nav */}
        <nav className="px-5 py-3 border-b border-sand-200">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center justify-between py-2.5 font-serif text-[22px] -tracking-[0.01em] ${
                  active ? 'text-clay-700 italic' : 'text-ink-900'
                }`}
              >
                {t(link.labelKey)}
                <ChevronRight size={18} strokeWidth={1.5} className="opacity-60" />
              </Link>
            )
          })}
        </nav>

        {/* Service section */}
        <div className="px-5 py-4 border-b border-sand-200">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink-500 font-medium mb-2">
            {t('drawer.serviceHeading')}
          </div>
          <Link
            href="/contact"
            onClick={onClose}
            className="block py-2 text-sm text-ink-800 hover:text-clay-700"
          >
            {t('utility.delivery')}
          </Link>
          <Link
            href="/contact"
            onClick={onClose}
            className="block py-2 text-sm text-ink-800 hover:text-clay-700"
          >
            {t('utility.pharmacists')}
          </Link>
          <Link
            href="/contact"
            onClick={onClose}
            className="block py-2 text-sm text-ink-800 hover:text-clay-700"
          >
            {t('utility.help')}
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-auto px-5 py-4 bg-sand-200 flex flex-col gap-2.5">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin/product"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-sand-300 rounded-sm text-sm font-medium text-ink-900"
                >
                  <Shield size={18} strokeWidth={1.5} className="text-ink-700" />
                  {t('adminDashboardAriaLabel')}
                </Link>
              )}
              <Link
                href="/account/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-sand-300 rounded-sm text-sm font-medium text-ink-900"
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
                className="text-left px-3.5 py-2 text-sm text-brick-600 hover:underline"
              >
                {t('signOut')}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-sand-300 rounded-sm text-sm font-medium text-ink-900"
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
