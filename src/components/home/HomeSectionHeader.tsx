import { Link } from '@/i18n/navigation'

interface HomeSectionHeaderProps {
  eyebrow: string
  /** HTML : accepte `<em>` pour le pivot italique. */
  title: string
  ctaLabel?: string
  ctaHref?: string
  invert?: boolean
}

/**
 * Header standardisé pour les sections de la home : eyebrow mono +
 * titre serif 44px (avec `<em>` accent clay) + CTA souligné optionnel.
 * `invert` pour fond sombre.
 */
export function HomeSectionHeader({
  eyebrow,
  title,
  ctaLabel,
  ctaHref,
  invert = false,
}: HomeSectionHeaderProps) {
  return (
    <div
      className={`flex justify-between items-baseline gap-4 flex-wrap pb-6 mb-10 border-b ${
        invert ? 'border-ink-700' : 'border-sand-300'
      }`}
    >
      <div>
        <div
          className={`font-mono text-[11px] uppercase tracking-[0.16em] font-semibold mb-2 ${
            invert ? 'text-clay-400' : 'text-clay-700'
          }`}
        >
          {eyebrow}
        </div>
        <h2
          className={`font-serif text-[32px] md:text-[44px] leading-none -tracking-[0.02em] [&_em]:not-italic [&_em]:italic ${
            invert
              ? 'text-sand-50 [&_em]:text-clay-400'
              : 'text-ink-900 [&_em]:text-clay-700'
          }`}
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </div>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className={`text-[13px] font-medium underline decoration-clay-200 underline-offset-[4px] whitespace-nowrap transition-colors ${
            invert ? 'text-clay-400' : 'text-clay-700 hover:text-clay-800'
          }`}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
