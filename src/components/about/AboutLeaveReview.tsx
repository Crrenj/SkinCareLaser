import { ArrowUpRight, Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { AboutSectionHead } from './AboutSectionHead'

/** Liens vers les fiches Google Maps des deux établissements. */
const FARMAU_MAPS_URL =
  'https://www.google.com/maps/place/Farmau/@19.4618225,-70.6836742,19z/data=!4m6!3m5!1s0x8eb1c500747cf989:0x6b535e43d4ff78f2!8m2!3d19.4618225!4d-70.6830305!16s%2Fg%2F11yr4q1_xp'
const SLC_MAPS_URL =
  'https://www.google.com/maps/place/Skin+Laser+Center/@19.4617822,-70.6830227,17z/data=!3m1!4b1!4m6!3m5!1s0x8eb1c58f3988034f:0x4310d796150c9765!8m2!3d19.4617822!4d-70.6830227!16s%2Fg%2F1tcv7chl'

export async function AboutLeaveReview() {
  const t = await getTranslations('About.review')

  return (
    <section className="bg-sand-50 px-6 lg:px-10 py-20 lg:py-[120px] border-b border-sand-300">
      <div className="max-w-[1320px] mx-auto">
        <AboutSectionHead
          num={t('num')}
          eyebrow={t('eyebrow')}
          titleHtml={t.raw('title') as string}
          lede={t('lede')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-start">
          <div>
            <div className="font-serif text-[20px] lg:text-[24px] leading-[1.5] -tracking-[0.005em] text-ink-800 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-700">
              <p
                className="mb-7"
                dangerouslySetInnerHTML={{ __html: t.raw('p1') as string }}
              />
              <p
                className="mb-9"
                dangerouslySetInnerHTML={{ __html: t.raw('p2') as string }}
              />
            </div>
            <a
              href={FARMAU_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex flex-col gap-1 px-7 py-5 rounded-[4px] bg-ink-900 text-sand-50 hover:bg-clay-700 transition-colors leading-tight"
            >
              <span className="inline-flex items-center gap-2.5 font-medium text-[15px]">
                <StarRow />
                {t('ctaReview')}
                <ArrowUpRight
                  size={16}
                  strokeWidth={1.8}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
              <span className="font-mono text-[11px] tracking-[0.06em] text-sand-300 ml-[26px]">
                {t('ctaReviewSub')}
              </span>
            </a>
          </div>

          <aside className="bg-sand-100 border border-sand-300 rounded-[4px] p-7 lg:p-8 flex flex-col gap-4">
            <p
              className="text-[14.5px] leading-[1.6] text-ink-700 [&_strong]:font-medium [&_strong]:text-ink-900"
              dangerouslySetInnerHTML={{ __html: t.raw('partnerNote') as string }}
            />
            <a
              href={SLC_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start px-4 py-2.5 rounded-[4px] border border-ink-900 text-ink-900 text-[13px] font-medium hover:bg-ink-900 hover:text-sand-50 transition-colors"
            >
              {t('partnerCta')}
              <ArrowUpRight size={14} strokeWidth={1.8} />
            </a>
          </aside>
        </div>
      </div>
    </section>
  )
}

function StarRow() {
  return (
    <span aria-hidden className="inline-flex gap-px text-clay-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} strokeWidth={0} fill="currentColor" />
      ))}
    </span>
  )
}
