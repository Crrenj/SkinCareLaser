'use client'

import { useTranslations } from 'next-intl'
import {
  User as UserIcon,
  ClipboardList,
  Heart,
  Shield,
  Settings,
  LogOut,
} from 'lucide-react'
import NextLink from 'next/link'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabaseClient'

const ITEMS = [
  { href: '/account/profile', key: 'profile', icon: UserIcon },
  { href: '/account/reservations', key: 'reservations', icon: ClipboardList },
  { href: '/favoris', key: 'favorites', icon: Heart },
  { href: '/account/security', key: 'security', icon: Shield },
  { href: '/account/preferences', key: 'preferences', icon: Settings },
] as const

export function AccountSidebar({
  userEmail,
  isAdmin = false,
}: {
  userEmail: string
  isAdmin?: boolean
}) {
  const t = useTranslations('Account.sidebar')
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="lg:sticky lg:top-32 lg:self-start">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-semibold mb-3">
        {t('heading')}
      </div>
      <p className="text-[12.5px] text-ink-500 mb-5 truncate" title={userEmail}>
        {userEmail}
      </p>
      <nav aria-label={t('heading')}>
        <ul className="flex flex-col gap-px">
          {ITEMS.map((item) => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-sm text-[14px] leading-snug border-l-2 transition-colors ${
                    active
                      ? 'border-clay-700 bg-sand-200 text-ink-900 font-semibold'
                      : 'border-transparent text-ink-700 hover:text-ink-900 hover:bg-sand-100'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.7} className={active ? 'text-clay-700' : 'text-ink-500'} />
                  <span>{t(`items.${item.key}`)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Pont vers l'admin : compte unique, deux casquettes. /admin n'est pas
          localisé → next/link brut (le Link next-intl préfixerait → 404). */}
      {isAdmin && (
        <NextLink
          href="/admin"
          className="mt-4 flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-sm text-[14px] font-semibold text-ink-900 bg-sand-200 hover:bg-sand-300 transition-colors w-[calc(100%+1.5rem)]"
        >
          <Shield size={16} strokeWidth={1.7} className="text-clay-700" />
          {t('adminPanel')}
        </NextLink>
      )}

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-6 flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-sm text-[14px] text-brick-600 hover:bg-brick-600/10 transition-colors w-[calc(100%+1.5rem)]"
      >
        <LogOut size={16} strokeWidth={1.7} />
        {t('signOut')}
      </button>
    </aside>
  )
}
