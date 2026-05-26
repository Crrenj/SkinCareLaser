import { getTranslations } from 'next-intl/server'

export async function AboutHero() {
  const t = await getTranslations('About.hero')

  return (
    <section
      className="relative px-6 lg:px-10 py-16 lg:py-24 border-b border-sand-300"
      style={{
        background:
          'radial-gradient(ellipse at 85% 30%, rgba(216,154,117,.18), transparent 60%), linear-gradient(180deg, var(--color-sand-100), var(--color-sand-50))',
      }}
    >
      <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-end">
        <div>
          <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-clay-700 font-medium mb-6 inline-flex items-center gap-2.5">
            <span>{t('eyebrow')}</span>
            <span aria-hidden className="block w-8 h-px bg-clay-700" />
          </div>
          <h1
            className="font-serif text-[56px] sm:text-[88px] lg:text-[120px] leading-[0.95] -tracking-[0.025em] text-ink-900 mb-9 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-700"
            dangerouslySetInnerHTML={{ __html: t.raw('title') as string }}
          />
          <p
            className="font-serif text-[20px] lg:text-[24px] leading-[1.45] text-ink-800 max-w-[620px] mb-10 [&_strong]:font-medium [&_strong]:text-ink-900"
            dangerouslySetInnerHTML={{ __html: t.raw('sub') as string }}
          />
          <div className="flex flex-wrap gap-x-7 gap-y-3 font-mono text-[11.5px] uppercase tracking-[0.08em] text-ink-500 pt-7 border-t border-sand-400">
            <span>
              {t('metaFoundedLabel')} · <b className="text-ink-800 font-medium">{t('metaFoundedValue')}</b>
            </span>
            <span>{t('metaCity')}</span>
            <span>
              {t('metaRegLabel')} · <b className="text-ink-800 font-medium">{t('metaRegValue')}</b>
            </span>
          </div>
        </div>

        <div
          aria-hidden
          className="relative aspect-[4/5] rounded-[4px] overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(255,255,255,.6), transparent 50%), linear-gradient(160deg, var(--color-sand-200), var(--color-sand-300) 60%, var(--color-clay-200))',
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(31,27,22,.012) 0 8px, transparent 8px 16px)',
            }}
          />
          <span className="absolute top-6 left-6 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-700 bg-sand-50 border border-sand-400 px-3 py-1.5 rounded-[2px]">
            <b className="text-clay-700 font-medium">{t('stampYear')}</b> · {t('stampCountry')}
          </span>

          <svg
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[64%] h-[88%]"
            viewBox="0 0 240 360"
            preserveAspectRatio="xMidYMax meet"
            role="img"
            aria-label={t('imageAlt')}
          >
            <defs>
              <linearGradient id="aboutHeroBottle" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#FBF8F4" />
                <stop offset="100%" stopColor="#D8D1C6" />
              </linearGradient>
            </defs>
            <ellipse cx="120" cy="345" rx="80" ry="9" fill="rgba(31,27,22,0.18)" />
            <rect x="90" y="60" width="60" height="32" rx="3" fill="#807969" />
            <rect x="98" y="38" width="44" height="24" rx="2" fill="#5A5448" />
            <rect x="108" y="22" width="24" height="18" rx="2" fill="#5A5448" />
            <rect
              x="74"
              y="92"
              width="92"
              height="240"
              rx="10"
              fill="url(#aboutHeroBottle)"
              stroke="#9A9388"
              strokeWidth="1.5"
            />
            <line x1="86" y1="138" x2="154" y2="138" stroke="#CCC5BD" strokeWidth="0.8" />
            <text
              x="120"
              y="178"
              textAnchor="middle"
              fontFamily="Instrument Serif"
              fontStyle="italic"
              fontSize="32"
              fill="#3C3830"
            >
              FARMAU
            </text>
            <line x1="100" y1="192" x2="140" y2="192" stroke="#8E5232" strokeWidth="0.8" />
            <text
              x="120"
              y="218"
              textAnchor="middle"
              fontFamily="Be Vietnam Pro"
              fontSize="9"
              fill="#807969"
              letterSpacing="2.4"
            >
              DERMO·COSMÉTICA
            </text>
            <text
              x="120"
              y="234"
              textAnchor="middle"
              fontFamily="Be Vietnam Pro"
              fontSize="9"
              fill="#807969"
              letterSpacing="2.4"
            >
              PROFESIONAL
            </text>
            <text
              x="120"
              y="280"
              textAnchor="middle"
              fontFamily="Instrument Serif"
              fontStyle="italic"
              fontSize="14"
              fill="#5A5448"
            >
              desde 2014 · Santiago R.D.
            </text>
            <text
              x="120"
              y="318"
              textAnchor="middle"
              fontFamily="Be Vietnam Pro"
              fontSize="13"
              fontWeight="600"
              fill="#807969"
            >
              50 ml — e
            </text>
          </svg>

          <div className="absolute bottom-6 right-6 bg-sand-50 border border-sand-300 px-5 py-4 rounded-[4px] max-w-[260px] text-[13px] leading-[1.5] text-ink-700 shadow-[0_18px_40px_-16px_rgba(31,27,22,.25)]">
            <div className="font-serif italic text-[17px] text-ink-900 mb-2">{t('cardTitle')}</div>
            {t('cardBody')}
          </div>
        </div>
      </div>
    </section>
  )
}
