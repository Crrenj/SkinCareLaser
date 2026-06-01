import { Link } from '@/i18n/navigation'

interface HomeSectionHeaderProps {
  /** Index courant éditorial : "01", "02", "03". */
  index: string
  /** Sur-titre mono (kicker). */
  kicker: string
  /** Titre serif — HTML, accepte `<em>` pour le pivot italique clay. */
  title: string
  ctaLabel?: string
  ctaHref?: string
  /** Sur fond sombre. */
  invert?: boolean
}

/**
 * En-tête de section éditorial (`.sec-head`) : index mono + kicker + titre serif
 * sur un filet de base, lien optionnel aligné à droite. Le système d'index
 * courants (01/02/03) remplace la formule eyebrow+titre+CTA répétée.
 */
export function HomeSectionHeader({
  index,
  kicker,
  title,
  ctaLabel,
  ctaHref,
  invert = false,
}: HomeSectionHeaderProps) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto] max-sm:grid-cols-1 items-end gap-x-6 gap-y-2.5 pb-5 mb-[clamp(32px,5vw,56px)] border-b ${
        invert ? 'border-ink-700' : 'border-sand-300'
      }`}
    >
      <span
        className={`font-mono text-[12px] tracking-[0.04em] pb-1.5 ${
          invert ? 'text-clay-400' : 'text-clay-700'
        }`}
      >
        {index}
      </span>
      <div>
        <div
          className={`font-mono text-[11px] uppercase tracking-[0.18em] mb-2 ${
            invert ? 'text-ink-400' : 'text-ink-500'
          }`}
        >
          {kicker}
        </div>
        <h2
          className={`font-serif font-normal text-[clamp(34px,4.6vw,60px)] leading-none -tracking-[0.02em] [&_em]:italic ${
            invert ? 'text-sand-50 [&_em]:text-clay-400' : 'text-ink-900 [&_em]:text-clay-700'
          }`}
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </div>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className={`text-[13px] whitespace-nowrap pb-2 border-b transition-colors max-sm:justify-self-start ${
            invert
              ? 'text-ink-400 border-ink-700 hover:text-sand-50 hover:border-clay-400'
              : 'text-ink-700 border-sand-400 hover:text-ink-900 hover:border-clay-700'
          }`}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
