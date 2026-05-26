import { getTranslations } from 'next-intl/server'
import { AboutSectionHead } from './AboutSectionHead'

export async function AboutManifest() {
  const t = await getTranslations('About.manifest')

  return (
    <section className="bg-sand-100 px-6 lg:px-10 py-20 lg:py-[120px] border-b border-sand-300">
      <div className="max-w-[1320px] mx-auto">
        <AboutSectionHead
          num={t('num')}
          eyebrow={t('eyebrow')}
          titleHtml={t.raw('title') as string}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-start">
          <aside className="lg:sticky lg:top-[140px] font-mono text-[11px] tracking-[0.14em] uppercase text-ink-500 leading-[1.8]">
            <h3 className="font-serif italic text-[19px] -tracking-[0.01em] text-ink-900 normal-case mb-3">
              {t('sideHeading')}
            </h3>
            <ul className="list-none m-0 p-0">
              {[t('side1'), t('side2'), t('side3')].map((label, i) => (
                <li
                  key={label}
                  className="py-1.5 border-b border-sand-300 flex justify-between gap-3"
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <b className="text-ink-800 font-medium">{label}</b>
                </li>
              ))}
            </ul>
            <p className="mt-7 font-mono text-[11px] text-ink-500 leading-[1.7] normal-case tracking-normal">
              {t('sideNote')}
            </p>
          </aside>

          <div className="font-serif text-[28px] sm:text-[36px] lg:text-[48px] leading-[1.22] -tracking-[0.012em] text-ink-900 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-700">
            <p
              className="mb-8"
              dangerouslySetInnerHTML={{ __html: t.raw('p1') as string }}
            />
            <p
              className="mb-8"
              dangerouslySetInnerHTML={{ __html: t.raw('p2') as string }}
            />
            <p
              className="mb-0"
              dangerouslySetInnerHTML={{ __html: t.raw('p3') as string }}
            />
            <div className="mt-12 pt-7 border-t border-sand-400 flex items-center gap-4.5 font-mono text-[11.5px] text-ink-500 tracking-[0.08em]">
              <span className="font-serif italic text-[28px] text-clay-700 leading-none">
                {t('signMark')}
              </span>
              <span>{t('signLine')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
