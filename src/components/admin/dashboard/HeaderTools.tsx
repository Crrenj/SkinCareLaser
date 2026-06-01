'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Moon, Sun } from 'lucide-react'
import { useAdminMode } from './AdminModeContext'

/**
 * Outils de vue du `PageHeader` admin (cf. maquette Sprint 3 « hdr-tools ») :
 * sélecteur de langue (FR/ES/EN) + bascule clair/sombre, sous forme de
 * segmented controls `.seg`. La langue passe par le cookie admin
 * (`POST /api/admin/set-locale` + `router.refresh()`), le mode lit le
 * contexte `useAdminMode` (état dans `_AdminShell`). Vit dans le header,
 * plus dans la sidebar.
 */
const ADMIN_LOCALES = [
  { code: 'fr', label: 'FR', title: 'Français' },
  { code: 'es', label: 'ES', title: 'Español' },
  { code: 'en', label: 'EN', title: 'English' },
] as const

const SEG = 'inline-flex bg-sand-100 border border-sand-300 rounded-lg p-[3px] gap-0.5'
const SEG_BTN =
  'inline-flex items-center justify-center min-w-[30px] rounded-md text-[12px] font-medium leading-none tracking-[0.04em] transition-colors disabled:cursor-default'
const SEG_ACTIVE = 'bg-sand-50 text-ink-900 shadow-[0_1px_2px_rgba(31,27,22,0.10)]'
const SEG_IDLE = 'text-ink-500 hover:text-ink-900'

export function HeaderTools() {
  const router = useRouter()
  const currentLocale = useLocale()
  const { mode, toggleMode } = useAdminMode()
  const t = useTranslations('Admin.chrome')
  const [switching, setSwitching] = useState(false)
  const isDark = mode === 'dark'

  const switchLocale = async (locale: string) => {
    if (locale === currentLocale || switching) return
    setSwitching(true)
    try {
      const res = await fetch('/api/admin/set-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      })
      if (res.ok) router.refresh()
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className={SEG} role="group" aria-label={t('localeSwitcherAria')}>
        {ADMIN_LOCALES.map((loc) => {
          const active = loc.code === currentLocale
          return (
            <button
              key={loc.code}
              type="button"
              onClick={() => switchLocale(loc.code)}
              disabled={switching || active}
              aria-pressed={active}
              title={loc.title}
              className={`${SEG_BTN} font-sans px-2.5 py-1.5 ${active ? SEG_ACTIVE : SEG_IDLE} ${
                switching && !active ? 'opacity-50' : ''
              }`}
            >
              {loc.label}
            </button>
          )
        })}
      </div>

      <div className={SEG} role="group" aria-label={t('themeGroupLabel')}>
        <button
          type="button"
          onClick={() => isDark && toggleMode()}
          disabled={!isDark}
          aria-pressed={!isDark}
          aria-label={t('themeToLight')}
          title={t('themeToLight')}
          className={`${SEG_BTN} px-2 py-1.5 ${!isDark ? SEG_ACTIVE : SEG_IDLE}`}
        >
          <Sun className="w-[15px] h-[15px]" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => !isDark && toggleMode()}
          disabled={isDark}
          aria-pressed={isDark}
          aria-label={t('themeToDark')}
          title={t('themeToDark')}
          className={`${SEG_BTN} px-2 py-1.5 ${isDark ? SEG_ACTIVE : SEG_IDLE}`}
        >
          <Moon className="w-[15px] h-[15px]" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
