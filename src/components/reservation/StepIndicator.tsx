'use client'

import { useTranslations } from 'next-intl'

export type ReservationStep = 'address' | 'shipping' | 'review'

type StepIndicatorProps = {
  current: ReservationStep
  /** Étapes déjà complétées. Permet l'affichage "Editar" + check. */
  completed: ReservationStep[]
  /** Callback quand l'utilisateur clique sur "Editar" d'une étape complétée. */
  onEdit?: (step: ReservationStep) => void
  /** Variante compacte mobile (numéros seulement, pas de label). */
  compact?: boolean
}

const STEPS: ReservationStep[] = ['address', 'shipping', 'review']

export function StepIndicator({ current, completed, onEdit, compact = false }: StepIndicatorProps) {
  const t = useTranslations('Reservation.stepIndicator')

  return (
    <ol
      className={
        compact
          ? 'flex items-center gap-2.5 px-5 py-3.5 bg-sand-100 border-b border-sand-300'
          : 'flex items-center gap-4 px-6 lg:px-14 pt-8 max-w-[1280px] mx-auto'
      }
      aria-label="reservation steps"
    >
      {STEPS.map((s, i) => {
        const isDone = completed.includes(s)
        const isCurrent = s === current
        return (
          <li
            key={s}
            className={`flex items-center gap-2.5 ${compact ? '' : 'flex-1 relative'}`}
          >
            {/* Trait de liaison (desktop only) */}
            {!compact && i > 0 && (
              <span
                aria-hidden
                className={`absolute -left-4 top-1/2 w-4 h-px ${
                  isDone || completed.includes(STEPS[i - 1]) ? 'bg-clay-700' : 'bg-sand-300'
                }`}
              />
            )}
            {/* Pastille */}
            <span
              className={`inline-flex items-center justify-center w-6 h-6 lg:w-[26px] lg:h-[26px] rounded-full border text-[11px] font-mono font-semibold transition-colors ${
                isDone
                  ? 'bg-clay-700 text-on-accent border-clay-700'
                  : isCurrent
                    ? 'bg-ink-900 text-sand-50 border-ink-900'
                    : 'bg-sand-200 text-ink-500 border-sand-300'
              }`}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={t(s)}
            >
              {isDone ? '✓' : i + 1}
            </span>
            {/* Trait compact entre numéros mobile */}
            {compact && i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={`flex-1 h-px ${
                  isDone || isCurrent ? 'bg-clay-700' : 'bg-sand-300'
                }`}
              />
            )}
            {/* Label desktop */}
            {!compact && (
              <span
                className={`text-[13px] font-medium ${
                  isDone
                    ? 'text-clay-700'
                    : isCurrent
                      ? 'text-ink-900 font-semibold'
                      : 'text-ink-500'
                }`}
              >
                {t(s)}
                {isDone && onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(s)}
                    className="ml-1.5 text-[11.5px] text-ink-500 underline underline-offset-2 hover:text-ink-900 transition-colors"
                  >
                    {t('edit')}
                  </button>
                )}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
