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
 *
 * Un MutationObserver sur `<html data-mode>` resynchronise l'icône quand une
 * AUTRE instance bascule le mode (ex. toggle navbar + toggle footer montés en
 * même temps) ou quand le script anti-flash le réécrit.
 *
 * `variant` : `panel` (défaut, footer sombre via tokens --c-ink-panel-*) ou
 * `nav` (navbar claire, aligné sur les autres boutons icône de la barre).
 */
const STORAGE_KEY = 'farmau:mode'

type Variant = 'panel' | 'nav'

export function ThemeModeToggle({
  className = '',
  variant = 'panel',
}: {
  className?: string
  variant?: Variant
}) {
  const t = useTranslations('Footer')
  const [mounted, setMounted] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const el = document.documentElement
    setAllowed(el.getAttribute('data-allow-mode') === '1')
    const sync = () => setMode(el.getAttribute('data-mode') === 'dark' ? 'dark' : 'light')
    sync()
    setMounted(true)
    const observer = new MutationObserver(sync)
    observer.observe(el, { attributes: true, attributeFilter: ['data-mode'] })
    return () => observer.disconnect()
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
  const iconSize = variant === 'nav' ? 19 : 16
  const variantClasses =
    variant === 'nav'
      ? 'h-10 w-10 rounded-[9px] text-ink-700 hover:bg-sand-100 hover:text-ink-900'
      : 'w-9 h-9 rounded-full border border-[var(--c-ink-panel-border)] text-[var(--c-ink-panel-fg)] hover:border-[var(--c-ink-panel-accent)] hover:text-[var(--c-ink-panel-accent)]'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? t('themeToLight') : t('themeToDark')}
      title={isDark ? t('themeToLight') : t('themeToDark')}
      className={`inline-flex items-center justify-center transition-colors ${variantClasses} ${className}`}
    >
      {isDark ? <Sun size={iconSize} strokeWidth={1.6} /> : <Moon size={iconSize} strokeWidth={1.6} />}
    </button>
  )
}
