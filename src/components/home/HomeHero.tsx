'use client'

import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

/**
 * Hero éditorial statique (540px) — gradient sand→clay→ink + formes
 * botaniques décoratives + texte gauche + 2 CTA (primary sand-50, ghost outline).
 * Pas alimenté par les bannières CMS : la marque s'imprime en premier.
 */
export function HomeHero() {
  const t = useTranslations('Home.hero')

  return (
    <section className="relative min-h-[540px] overflow-hidden flex items-center bg-gradient-to-br from-[#C7B299] via-[#8E6D4F] to-[#4A3A2C]">
      <BotanicalDeco />

      {/* Overlay sombre gradient gauche → transparent droite */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-900/55 via-ink-900/35 to-transparent" />

      <div className="relative z-10 px-8 md:px-16 lg:px-20 py-14 md:py-16 max-w-[60%] text-white">
        <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-clay-200 mb-5 px-3 py-1 border border-clay-200/40 rounded-sm">
          {t('eyebrow')}
        </span>
        <h1
          className="font-serif text-[48px] md:text-[60px] lg:text-[72px] leading-[0.98] -tracking-[0.025em] text-white mb-5 text-balance [&_em]:not-italic [&_em]:italic [&_em]:text-clay-200"
          dangerouslySetInnerHTML={{ __html: t.raw('title') as string }}
        />
        <p className="font-serif italic text-[18px] md:text-[20px] leading-[1.4] text-sand-50/90 mb-8 max-w-[520px]">
          {t('description')}
        </p>
        <div className="flex flex-wrap items-center gap-3.5">
          <Link
            href="/catalogue"
            className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-sm bg-sand-50 text-ink-900 text-[13px] font-semibold uppercase tracking-wider hover:bg-white transition-colors"
          >
            {t('primaryCta')}
            <ArrowRight size={16} strokeWidth={1.8} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/a-propos"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-sm bg-transparent text-sand-50 border border-sand-50/50 text-[13px] font-semibold uppercase tracking-wider hover:bg-sand-50/10 hover:border-sand-50 transition-colors"
          >
            {t('ghostCta')}
          </Link>
        </div>
      </div>
    </section>
  )
}

function BotanicalDeco() {
  return (
    <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-[720px] h-[720px] opacity-60 pointer-events-none">
      <svg viewBox="0 0 600 600" className="w-full h-full">
        <defs>
          <radialGradient id="home-hero-leaf" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#F4EFE7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8E6D4F" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="300" cy="300" rx="240" ry="180" fill="url(#home-hero-leaf)" />
        <path
          d="M 380 200 Q 420 280 380 360 Q 320 380 280 320 Q 240 240 280 180 Q 340 160 380 200 Z"
          fill="#CCC5BD"
          opacity="0.4"
        />
        <path
          d="M 200 380 Q 240 460 200 540 Q 140 560 100 500 Q 60 420 100 360 Q 160 340 200 380 Z"
          fill="#D89A75"
          opacity="0.3"
        />
        <circle cx="450" cy="450" r="80" fill="#F0D7C5" opacity="0.4" />
        <circle cx="150" cy="200" r="50" fill="#CCC5BD" opacity="0.3" />
      </svg>
    </div>
  )
}
