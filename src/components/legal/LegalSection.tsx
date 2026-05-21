import { ReactNode } from 'react'

interface LegalSectionProps {
  id: string
  num: string
  title: string
  children: ReactNode
}

/** Section numérotée d'un document légal. `id` pour ancres profondes. */
export function LegalSection({ id, num, title, children }: LegalSectionProps) {
  return (
    <section id={id} className="scroll-mt-32 mb-10">
      <div className="flex items-baseline gap-4 mb-3">
        <span className="font-serif italic text-[28px] leading-none text-clay-400 -tracking-[0.01em] shrink-0">
          {num}
        </span>
        <h2 className="font-serif text-[24px] lg:text-[28px] leading-[1.15] -tracking-[0.01em] text-ink-900">
          {title}
        </h2>
      </div>
      <div className="text-[15px] leading-[1.7] text-ink-800 space-y-3 [&_a]:underline [&_a]:underline-offset-2 [&_a]:text-clay-700 hover:[&_a]:text-clay-800 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_strong]:text-ink-900 [&_strong]:font-semibold [&_table]:w-full [&_table]:my-4 [&_table]:text-[13.5px] [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink-900 [&_th]:py-2 [&_th]:px-3 [&_th]:border-b [&_th]:border-sand-400 [&_td]:py-2 [&_td]:px-3 [&_td]:border-b [&_td]:border-sand-300 [&_td]:align-top">
        {children}
      </div>
    </section>
  )
}
