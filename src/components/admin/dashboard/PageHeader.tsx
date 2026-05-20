import Link from 'next/link'

type Crumb = { label: string; href?: string }

type PageHeaderProps = {
  /** Fil d'ariane uppercase, séparé par "/". Dernier élément = page courante. */
  crumbs: Crumb[]
  /** Titre H1 serif. */
  title: string
  /** Boutons/actions à droite (Server-safe). */
  actions?: React.ReactNode
}

/**
 * En-tête sticky utilisé par toutes les pages /admin/*. Background sand-50
 * pour matcher la zone principale du dashboard.
 */
export function PageHeader({ crumbs, title, actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-sand-50 border-b border-sand-300 px-5 lg:px-8 py-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-1">
        {crumbs.length > 0 && (
          <nav
            aria-label="breadcrumb"
            className="text-[11px] tracking-[0.12em] uppercase text-ink-500 font-medium flex flex-wrap items-center"
          >
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1
              const sep =
                i > 0 ? (
                  <span aria-hidden className="mx-2 text-ink-400">
                    /
                  </span>
                ) : null
              if (c.href && !isLast) {
                return (
                  <span key={c.label} className="inline-flex items-center">
                    {sep}
                    <Link href={c.href} className="text-ink-500 hover:text-ink-900 transition-colors no-underline">
                      {c.label}
                    </Link>
                  </span>
                )
              }
              return (
                <span key={c.label} className={`inline-flex items-center ${isLast ? 'text-ink-700' : ''}`}>
                  {sep}
                  <span>{c.label}</span>
                </span>
              )
            })}
          </nav>
        )}
        <h1 className="font-serif text-[26px] lg:text-[30px] tracking-[-0.01em] text-ink-900 leading-[1.1] m-0">
          {title}
        </h1>
      </div>
      {actions && <div className="flex flex-wrap gap-2.5 items-center">{actions}</div>}
    </header>
  )
}
