'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

interface LocaleSwitcherProps {
  /** Variante visuelle. `inline` = "FR · EN · ES" pour l'utility row,
   *  `block` = boutons empilés pour le drawer mobile. */
  variant?: 'inline' | 'block'
  /** Callback optionnel exécuté avant le switch (ex: fermer un drawer). */
  onBeforeSwitch?: () => void
}

/**
 * Switcher de langue locale-aware.
 *
 * Stratégie : `router.replace(pathname, { locale })` où `pathname` provient
 * de `usePathname()` de next-intl (qui strippe déjà la locale). On reste
 * donc sur la même page, juste dans une autre langue.
 *
 * `useTransition` pour ne pas bloquer l'UI pendant la navigation (loading
 * de la nouvelle locale).
 */
export function LocaleSwitcher({
  variant = 'inline',
  onBeforeSwitch,
}: LocaleSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleSwitch = (target: string) => {
    if (target === locale) return
    onBeforeSwitch?.()
    startTransition(() => {
      // `target` est bien une locale valide (vient de routing.locales)
      router.replace(pathname, { locale: target as (typeof routing.locales)[number] })
    })
  }

  if (variant === 'block') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {routing.locales.map((loc) => {
          const active = loc === locale
          return (
            <button
              key={loc}
              type="button"
              onClick={() => handleSwitch(loc)}
              disabled={isPending}
              aria-current={active ? 'true' : undefined}
              className={`py-2 text-xs uppercase tracking-wider border rounded-sm transition-colors ${
                active
                  ? 'bg-ink-900 text-sand-50 border-ink-900'
                  : 'bg-sand-50 text-ink-800 border-sand-300 hover:border-ink-700'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loc}
            </button>
          )
        })}
      </div>
    )
  }

  // variant inline — séparateurs · entre les locales
  return (
    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
      {routing.locales.map((loc, i) => {
        const active = loc === locale
        return (
          <span key={loc} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSwitch(loc)}
              disabled={isPending}
              aria-current={active ? 'true' : undefined}
              className={`hover:text-ink-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                active ? 'font-semibold text-ink-900' : 'text-ink-700'
              }`}
            >
              {loc}
            </button>
            {i < routing.locales.length - 1 && (
              <span className="text-ink-500" aria-hidden>
                ·
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
