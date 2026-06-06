'use client'

import { useTranslations } from 'next-intl'

type Step = 1 | 2 | 3 | 4
type State = 'done' | 'current' | 'pending'

const STATES: Record<Step, State> = {
  1: 'done',
  2: 'current',
  3: 'pending',
  4: 'pending',
}

export function ReservationTimeline({ reference }: { reference: string }) {
  const t = useTranslations('Reservation.confirmation')
  const tT = useTranslations('Reservation.confirmation.timeline')

  return (
    <article className="bg-sand-50 border border-sand-300 rounded-xl p-6 lg:p-8">
      <h3 className="font-serif text-[20px] lg:text-[22px] m-0 mb-4 text-ink-900">
        {t('timelineTitle')}
      </h3>

      <ol className="flex flex-col">
        {[1, 2, 3, 4].map((step) => {
          const state = STATES[step as Step]
          const isLast = step === 4
          return (
            <li
              key={step}
              className={`relative grid grid-cols-[28px_1fr] gap-4 py-3.5 ${
                isLast ? '' : 'border-b border-sand-200'
              }`}
            >
              {!isLast && (
                <span
                  aria-hidden
                  className={`absolute left-3.5 top-[14px] bottom-[-15px] w-px ${
                    state === 'done' ? 'bg-olive-600/30' : 'bg-sand-300'
                  }`}
                />
              )}
              <span
                className={`relative z-10 w-7 h-7 rounded-full inline-flex items-center justify-center text-[11px] font-mono font-semibold border ${
                  state === 'done'
                    ? 'bg-olive-600 text-white border-olive-600'
                    : state === 'current'
                      ? 'bg-clay-700 text-on-accent border-clay-700'
                      : 'bg-sand-200 text-ink-700 border-sand-300'
                }`}
                aria-label={`Step ${step}`}
              >
                {state === 'done' ? '✓' : step}
              </span>
              <div>
                <h4 className="text-[15px] font-semibold text-ink-900 m-0 mb-1">
                  {tT(`step${step}Title`)}
                </h4>
                <p className="text-[13.5px] text-ink-700 m-0 leading-[1.55]">
                  {step === 1
                    ? tT.rich('step1Body', {
                        ref: () => (
                          <code className="font-mono text-[12px] bg-sand-100 border border-sand-300 px-1.5 py-0.5 rounded text-ink-900">
                            {reference}
                          </code>
                        ),
                      })
                    : tT(`step${step}Body`)}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </article>
  )
}
