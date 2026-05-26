import { getTranslations } from 'next-intl/server'
import { AboutSectionHead } from './AboutSectionHead'

export async function AboutCriteria() {
  const t = await getTranslations('About.criteria')

  const criteria = [
    { titleKey: 'c1Title', bodyKey: 'c1Body' },
    { titleKey: 'c2Title', bodyKey: 'c2Body' },
    { titleKey: 'c3Title', bodyKey: 'c3Body' },
    { titleKey: 'c4Title', bodyKey: 'c4Body' },
  ] as const

  const certs = [
    { glyph: 'D', nameKey: 'cert1Name', descKey: 'cert1Desc', statusKey: 'cert1Status' },
    { glyph: 'C', nameKey: 'cert2Name', descKey: 'cert2Desc', statusKey: 'cert2Status' },
    { glyph: 'E', nameKey: 'cert3Name', descKey: 'cert3Desc', statusKey: 'cert3Status' },
    { glyph: 'B', nameKey: 'cert4Name', descKey: 'cert4Desc', statusKey: 'cert4Status' },
  ] as const

  return (
    <section className="bg-sand-100 px-6 lg:px-10 py-20 lg:py-[120px] border-b border-sand-300">
      <div className="max-w-[1320px] mx-auto">
        <AboutSectionHead
          num={t('num')}
          eyebrow={t('eyebrow')}
          titleHtml={t.raw('title') as string}
          lede={t('lede')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-24 items-start">
          <ol className="list-none m-0 p-0">
            {criteria.map((c, i) => (
              <li
                key={c.titleKey}
                className={`grid grid-cols-[64px_1fr] gap-5 ${
                  i === 0 ? 'pt-0' : 'pt-8'
                } pb-8 ${i === criteria.length - 1 ? 'border-b-0' : 'border-b border-sand-300'}`}
              >
                <div className="font-serif italic text-[36px] text-clay-700 leading-none">
                  {String(i + 1).padStart(2, '0')}.
                </div>
                <div>
                  <h3 className="font-serif text-[24px] lg:text-[26px] leading-[1.15] -tracking-[0.01em] text-ink-900 mb-2.5">
                    {t(c.titleKey)}
                  </h3>
                  <p
                    className="text-[14.5px] leading-[1.6] text-ink-700 [&_strong]:text-ink-900 [&_strong]:font-medium"
                    dangerouslySetInnerHTML={{ __html: t.raw(c.bodyKey) as string }}
                  />
                </div>
              </li>
            ))}
          </ol>

          <aside className="bg-ink-900 text-sand-100 p-10 rounded-[4px] lg:sticky lg:top-[140px]">
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-clay-400 mb-7">
              {t('certsHeading')}
            </div>
            {certs.map((c, i) => (
              <div
                key={c.glyph}
                className={`grid grid-cols-[56px_1fr_auto] gap-4 items-center py-4.5 ${
                  i === certs.length - 1 ? 'border-b-0' : 'border-b border-ink-700'
                }`}
              >
                <div className="w-14 h-14 rounded-full border border-ink-700 flex items-center justify-center font-serif italic text-[22px] text-clay-400">
                  {c.glyph}
                </div>
                <div className="leading-[1.4]">
                  <div className="font-serif text-[18px] -tracking-[0.01em] text-sand-50">
                    {t(c.nameKey)}
                  </div>
                  <div className="text-[12px] text-sand-400 mt-0.5">{t(c.descKey)}</div>
                </div>
                <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-olive-600 inline-flex items-center gap-1.5 whitespace-nowrap">
                  <span aria-hidden className="w-[7px] h-[7px] rounded-full bg-[#8AB672]" />
                  {t(c.statusKey)}
                </span>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  )
}
