'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('Error')

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-[48px] leading-[1.05] text-ink-900 mb-4">
        {t('title')}
      </h1>
      <p className="text-[15px] text-ink-700 max-w-md mb-8">{t('body')}</p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="h-11 px-6 rounded-lg bg-clay-700 text-sand-50 text-[14px] font-medium hover:bg-clay-800 transition-colors"
        >
          {t('retry')}
        </button>
        <Link
          href="/"
          className="h-11 px-6 rounded-lg border border-sand-300 text-ink-900 text-[14px] font-medium flex items-center hover:bg-sand-200 transition-colors"
        >
          {t('home')}
        </Link>
      </div>
    </main>
  )
}
