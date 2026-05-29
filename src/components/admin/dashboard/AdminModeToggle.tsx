'use client'

import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Bascule clair/sombre du panneau admin. Composant CONTRÔLÉ : l'état `mode`
 * + la persistance (`localStorage['farmau:admin-mode']`) vivent dans
 * `_AdminShell`, qui pose `data-mode` sur le wrapper admin (PAS sur <html>,
 * pour rester indépendant du mode visiteur du site public). Ici purement
 * présentationnel — styling clair aligné sur les boutons de la sidebar.
 */
export function AdminModeToggle({
  mode,
  onToggle,
  className = '',
}: {
  mode: 'light' | 'dark'
  onToggle: () => void
  className?: string
}) {
  const t = useTranslations('Admin.chrome')
  const isDark = mode === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? t('themeToLight') : t('themeToDark')}
      title={isDark ? t('themeToLight') : t('themeToDark')}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-md border border-sand-300 bg-sand-50 text-ink-700 hover:border-ink-900 hover:text-ink-900 hover:bg-sand-200 transition-colors ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" strokeWidth={1.7} /> : <Moon className="w-4 h-4" strokeWidth={1.7} />}
    </button>
  )
}
