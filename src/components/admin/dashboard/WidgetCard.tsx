import Link from 'next/link'

type WidgetCardProps = {
  title: string
  subtitle?: string
  /** Lien « Ver … → » en haut à droite. */
  link?: { href: string; label: string }
  /** Classes de grille (ex. "col-span-12 lg:col-span-6"). */
  className?: string
  /** Espacement vertical interne (header ↔ body). Défaut gap-3.5. */
  gap?: string
  children: React.ReactNode
}

/**
 * Coque partagée des widgets du dashboard admin. Reproduit à l'identique
 * l'en-tête des widgets historiques (titre serif 20px, sous-titre ink-500,
 * lien discret) pour une cohérence visuelle parfaite.
 */
export function WidgetCard({
  title,
  subtitle,
  link,
  className = 'col-span-12',
  gap = 'gap-3.5',
  children,
}: WidgetCardProps) {
  return (
    <article
      className={`bg-sand-50 border border-sand-300 rounded-xl p-5 lg:p-6 flex flex-col ${gap} ${className}`}
    >
      <div className="flex justify-between items-baseline gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-[20px] text-ink-900 m-0 mb-0.5 leading-tight">{title}</h3>
          {subtitle && <small className="text-[11.5px] text-ink-500 block">{subtitle}</small>}
        </div>
        {link && (
          <Link
            href={link.href}
            className="shrink-0 text-[11.5px] tracking-[0.06em] text-ink-700 hover:text-ink-900 border-b border-transparent hover:border-current transition-colors"
          >
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </article>
  )
}
