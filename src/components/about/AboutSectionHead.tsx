type Props = {
  num: string
  eyebrow: string
  /** Title HTML — peut contenir <em> et <br>. */
  titleHtml: string
  lede?: string
  /** Variante sombre : couleurs invertes pour fond ink-900. */
  dark?: boolean
}

export function AboutSectionHead({ num, eyebrow, titleHtml, lede, dark = false }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 lg:gap-9 items-end mb-10 lg:mb-16">
      <div
        className={`font-serif italic leading-[0.85] text-[64px] lg:text-[96px] ${
          dark ? 'text-clay-400' : 'text-clay-700'
        }`}
      >
        {num}
      </div>
      <div>
        <div
          className={`font-mono text-[11px] tracking-[0.16em] uppercase mb-3.5 ${
            dark ? 'text-clay-400' : 'text-clay-700'
          }`}
        >
          {eyebrow}
        </div>
        <h2
          className={`font-serif text-[40px] lg:text-[64px] leading-none -tracking-[0.018em] [&_em]:not-italic [&_em]:italic ${
            dark ? '[&_em]:text-clay-400' : '[&_em]:text-clay-700'
          }`}
          dangerouslySetInnerHTML={{ __html: titleHtml }}
        />
        {lede && (
          <p
            className={`font-serif text-[20px] lg:text-[22px] leading-[1.5] mt-5 max-w-[720px] ${
              dark ? 'text-sand-300' : 'text-ink-700'
            }`}
          >
            {lede}
          </p>
        )}
      </div>
    </div>
  )
}
