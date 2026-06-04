import Link from 'next/link'

type MiniStatProps = {
  label: string
  value: string
  sub?: string
  href?: string
}

/**
 * Mini-statistique sur fond sand-100 (label uppercase + valeur serif + sous-
 * titre). Brique de base des widgets « Actividad » et « Contenido ».
 */
export function MiniStat({ label, value, sub, href }: MiniStatProps) {
  const inner = (
    <>
      <span className="text-[10.5px] tracking-[0.12em] uppercase text-ink-500 font-semibold leading-[1.4]">
        {label}
      </span>
      <span className="font-serif text-[25px] leading-none text-ink-900 mt-1.5 tracking-[-0.01em]">
        {value}
      </span>
      {sub && <span className="block text-[11px] text-ink-500 mt-1.5 leading-[1.4]">{sub}</span>}
    </>
  )
  const base = 'flex flex-col rounded-lg bg-sand-100 p-3.5 min-h-[92px]'
  if (href) {
    return (
      <Link href={href} className={`${base} no-underline hover:bg-sand-200 transition-colors`}>
        {inner}
      </Link>
    )
  }
  return <div className={base}>{inner}</div>
}
