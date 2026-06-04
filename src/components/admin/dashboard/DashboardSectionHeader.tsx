type Props = {
  /** Index courant éditorial (ex. "01"). */
  index: string
  title: string
  description?: string
}

/**
 * En-tête de section du dashboard. Reprend le motif éditorial du site
 * (index mono + titre serif + filet) pour relier l'admin au reste du design.
 */
export function DashboardSectionHeader({ index, title, description }: Props) {
  return (
    <div className="flex items-baseline gap-3 border-b border-sand-300 pb-2.5">
      <span className="font-mono text-[11px] tracking-[0.22em] text-clay-700 leading-none">
        {index}
      </span>
      <h2 className="font-serif text-[19px] lg:text-[21px] text-ink-900 leading-none m-0">{title}</h2>
      {description && (
        <span className="ml-auto text-[12px] text-ink-500 hidden md:block truncate max-w-[50%]">
          {description}
        </span>
      )}
    </div>
  )
}
