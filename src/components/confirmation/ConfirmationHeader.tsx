'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  reference: string
  firstName?: string
}

export function ConfirmationHeader({ reference, firstName }: Props) {
  const t = useTranslations('Reservation.confirmation')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Pas de fallback — la référence reste visible et copiable manuellement
    }
  }

  return (
    <header className="flex flex-col gap-3.5">
      <span className="inline-flex items-center gap-2.5 text-[11.5px] tracking-[0.16em] uppercase text-olive-600 font-semibold w-fit">
        <span className="relative w-2.5 h-2.5 rounded-full bg-olive-600 inline-flex">
          <span
            aria-hidden
            className="absolute -inset-1 rounded-full border-2 border-olive-600/30 animate-[pulse_2.4s_ease-out_infinite]"
          />
        </span>
        {t('tag')}
      </span>

      <h1 className="font-serif text-[42px] sm:text-[48px] lg:text-[56px] leading-[1.05] tracking-[-0.015em] text-ink-900 m-0">
        {firstName ? (
          <>
            {t('greeting')}
            <br />
            <em className="not-italic text-clay-700" style={{ fontStyle: 'italic' }}>
              {firstName}.
            </em>
          </>
        ) : (
          t('greetingNoName')
        )}
      </h1>

      <div className="text-[14px] text-ink-700 flex items-center flex-wrap gap-2">
        <span>{t('referenceLabel')} ·</span>
        <code className="font-mono bg-sand-50 border border-sand-300 text-[13px] px-2.5 py-1 rounded text-ink-900 font-medium">
          {reference}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={t('copyAriaLabel')}
          className="bg-transparent border-0 text-[11px] tracking-[0.1em] uppercase text-ink-500 hover:text-ink-900 underline underline-offset-[3px] transition-colors"
        >
          {copied ? t('copied') : t('copy')}
        </button>
        {copied && (
          <span
            role="status"
            className="inline-flex items-center gap-1 text-[11px] tracking-[0.1em] uppercase text-olive-600"
            aria-live="polite"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-olive-600" />
            {t('copied')}
          </span>
        )}
      </div>
    </header>
  )
}
