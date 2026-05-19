import { Link } from '@/i18n/navigation'

export interface BreadcrumbItem {
  href?: string
  label: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Fil d'Ariane simple, séparateur "›" en ink-200.
 * Les items avec `current: true` ne sont pas cliquables et passent en ink-900.
 */
export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-2 px-8 py-4 text-[12px] text-ink-500 bg-sand-50 border-b border-sand-200 ${className}`}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <span key={`${item.label}-${idx}`} className="flex items-center gap-2">
            {item.current || !item.href ? (
              <span className={item.current ? 'text-ink-900' : ''}>{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-ink-800 transition-colors">
                {item.label}
              </Link>
            )}
            {!isLast && <span aria-hidden className="text-ink-200">›</span>}
          </span>
        )
      })}
    </nav>
  )
}
