'use client'

import { useTranslations } from 'next-intl'

/**
 * Score 0..4 :
 *  - 0 : vide ou < 8 caractères
 *  - 1 : >= 8 caractères, aucune diversité
 *  - 2 : 1 critère de diversité (chiffre OU majuscule OU symbole)
 *  - 3 : 2 critères de diversité
 *  - 4 : 3 critères + au moins 12 caractères
 *
 * Pas une vraie validation — c'est purement indicatif. Le minimum hardcoded
 * (longueur >= 8) reste la seule contrainte avant submit.
 */
export function scorePassword(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (pw.length < 8) return 0
  let variety = 0
  if (/\d/.test(pw)) variety += 1
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) variety += 1
  if (/[^A-Za-z0-9]/.test(pw)) variety += 1
  if (variety === 0) return 1
  if (variety === 1) return 2
  if (variety === 2) return 3
  return pw.length >= 12 ? 4 : 3
}

const BAR_COLORS: Record<0 | 1 | 2 | 3 | 4, string[]> = {
  0: ['bg-sand-200', 'bg-sand-200', 'bg-sand-200', 'bg-sand-200'],
  1: ['bg-clay-400', 'bg-sand-200', 'bg-sand-200', 'bg-sand-200'],
  2: ['bg-clay-400', 'bg-clay-400', 'bg-sand-200', 'bg-sand-200'],
  3: ['bg-clay-600', 'bg-clay-600', 'bg-clay-600', 'bg-sand-200'],
  4: ['bg-olive-600', 'bg-olive-600', 'bg-olive-600', 'bg-olive-600'],
}

export function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations('Auth.strength')
  const score = scorePassword(password)
  const bars = BAR_COLORS[score]
  const labelKey = (
    ['empty', 'weak', 'fair', 'good', 'strong'] as const
  )[score]

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1 mt-1" aria-hidden>
        {bars.map((cls, i) => (
          <span
            key={i}
            className={`flex-1 h-[3px] rounded-sm transition-colors ${cls}`}
          />
        ))}
      </div>
      {password.length > 0 && (
        <p className="text-[12px] text-ink-500" role="status" aria-live="polite">
          {t(labelKey)}
        </p>
      )}
    </div>
  )
}
