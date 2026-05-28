'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Bascule clair/sombre pour le visiteur (affichée seulement si l'admin a
 * activé `allow_visitor_mode`). Lit/écrit `document.documentElement[data-mode]`
 * + `localStorage['farmau:mode']` (relu par le script anti-flash du <head>).
 *
 * Rend `null` côté serveur et au 1er render client (pas d'info DOM encore) :
 * pas de mismatch d'hydratation, l'icône apparaît après le mount.
 */
const STORAGE_KEY = 'farmau:mode'

export function ThemeModeToggle({ className = '' }: { className?: string }) {
  const t = useTranslations('Footer')
  const [mounted, setMounted] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const el = document.documentElement
    setAllowed(el.getAttribute('data-allow-mode') === '1')
    setMode(el.getAttribute('data-mode') === 'dark' ? 'dark' : 'light')
    setMounted(true)
  }, [])

  if (!mounted || !allowed) return null

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-mode', next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage indisponible (mode privé strict) → la bascule reste
      // effective pour la session, juste non persistée.
    }
    setMode(next)
  }

  const isDark = mode === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? t('themeToLight') : t('themeToDark')}
      title={isDark ? t('themeToLight') : t('themeToDark')}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--c-ink-panel-border)] text-[var(--c-ink-panel-fg)] hover:border-[var(--c-ink-panel-accent)] hover:text-[var(--c-ink-panel-accent)] transition-colors ${className}`}
    >
      {isDark ? <Sun size={16} strokeWidth={1.6} /> : <Moon size={16} strokeWidth={1.6} />}
    </button>
  )
}
