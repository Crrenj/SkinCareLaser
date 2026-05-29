import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

/**
 * Bloc éditorial "Notre approche" — 2 colonnes (packshot SVG + texte).
 * Différenciateur métier : signe-t-on la home avec "pharmacie, pas commerce".
 */
export async function HomeExpertise() {
  const t = await getTranslations('Home.expertise')

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 bg-sand-100 min-h-[480px]">
      <div className="bg-gradient-to-br from-sand-300 to-sand-500 flex items-center justify-center p-10">
        <svg
          viewBox="0 0 240 320"
          preserveAspectRatio="xMidYMid meet"
          className="w-[55%] h-[70%] drop-shadow-[0_8px_24px_rgba(31,27,22,0.15)]"
        >
          <defs>
            <linearGradient id="bottle-grad-home" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#FBF8F4" />
              <stop offset="100%" stopColor="#E0D8CB" />
            </linearGradient>
          </defs>
          <ellipse cx="120" cy="300" rx="80" ry="10" fill="rgba(31,27,22,0.15)" />
          <rect x="86" y="80" width="68" height="30" rx="3" fill="#9A9388" />
          <rect x="96" y="60" width="48" height="22" rx="2" fill="#807969" />
          <rect x="106" y="46" width="28" height="16" rx="2" fill="#807969" />
          <rect x="74" y="110" width="92" height="180" rx="8" fill="url(#bottle-grad-home)" stroke="#9A9388" strokeWidth="1.5" />
          <text x="120" y="180" textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontSize="22" fill="#5A5448">
            FARMAU
          </text>
          <line x1="92" y1="190" x2="148" y2="190" stroke="#CCC5BD" strokeWidth="1" />
          <text x="120" y="210" textAnchor="middle" fontFamily="Be Vietnam Pro" fontSize="9" fill="#807969" letterSpacing="2">
            PHARMACIE
          </text>
          <text x="120" y="225" textAnchor="middle" fontFamily="Be Vietnam Pro" fontSize="9" fill="#807969" letterSpacing="2">
            DERMATOLOGIQUE
          </text>
          <text x="120" y="270" textAnchor="middle" fontFamily="Be Vietnam Pro" fontSize="14" fontWeight="700" fill="#807969">
            50 ml
          </text>
        </svg>
      </div>

      <div className="px-8 md:px-14 lg:px-16 py-12 lg:py-16 flex flex-col justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-clay-700 font-semibold mb-4">
          {t('eyebrow')}
        </div>
        <h2
          className="font-serif text-[36px] md:text-[48px] leading-[1.05] -tracking-[0.02em] text-ink-900 mb-5 text-balance [&_em]:not-italic [&_em]:italic [&_em]:text-clay-700"
          dangerouslySetInnerHTML={{ __html: t.raw('title') as string }}
        />
        <p className="text-[15.5px] leading-[1.65] text-ink-800 mb-4 max-w-[440px]">
          {t('p1')}
        </p>
        <p className="text-[15.5px] leading-[1.65] text-ink-800 mb-7 max-w-[440px]">
          {t.rich('p2', {
            strong: (chunks) => <strong className="font-semibold text-ink-900">{chunks}</strong>,
          })}
        </p>
        <Link
          href="/a-propos"
          className="group inline-flex items-center gap-2.5 self-start px-5 py-3 rounded-sm bg-transparent border border-ink-900 text-ink-900 text-[13px] font-semibold uppercase tracking-wider hover:bg-ink-900 hover:text-sand-50 transition-colors"
        >
          {t('cta')}
          <ArrowRight size={16} strokeWidth={1.8} className="transition-transform group-hover:translate-x-1" />
        </Link>
        <div className="font-serif italic text-[15px] text-ink-500 mt-7 pt-4 border-t border-sand-300 max-w-[440px]">
          {t('signature')}
        </div>
      </div>
    </section>
  )
}
