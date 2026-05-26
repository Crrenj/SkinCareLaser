import { Facebook, MapPin, Clock, Phone } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { AboutSectionHead } from './AboutSectionHead'
import { getShopSettings, telHref } from '@/lib/getShopSettings'

/** Liens externes vers Skin Laser Center (clinique partenaire dans le même bâtiment). */
const SLC_FACEBOOK_URL = 'https://www.facebook.com/skinlasercenter/'
const SLC_MAPS_URL =
  'https://www.google.com/maps/place/Skin+Laser+Center/@19.4617822,-70.6830227,17z/data=!3m1!4b1!4m6!3m5!1s0x8eb1c58f3988034f:0x4310d796150c9765!8m2!3d19.4617822!4d-70.6830227!16s%2Fg%2F1tcv7chl'

export async function AboutPartner() {
  const t = await getTranslations('About.partner')
  const settings = await getShopSettings()
  const phoneHref = telHref(settings.contact_phone)

  return (
    <section className="bg-sand-100 px-6 lg:px-10 py-20 lg:py-[120px] border-b border-sand-300">
      <div className="max-w-[1320px] mx-auto">
        <AboutSectionHead
          num={t('num')}
          eyebrow={t('eyebrow')}
          titleHtml={t.raw('title') as string}
          lede={t('lede')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-start">
          <div className="font-serif text-[20px] lg:text-[24px] leading-[1.5] -tracking-[0.005em] text-ink-800 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-700">
            <p
              className="mb-7"
              dangerouslySetInnerHTML={{ __html: t.raw('p1') as string }}
            />
            <p
              className="mb-0"
              dangerouslySetInnerHTML={{ __html: t.raw('p2') as string }}
            />
          </div>

          <aside className="bg-sand-50 border border-sand-300 rounded-[4px] p-7 lg:p-8 flex flex-col gap-5">
            <div>
              <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-clay-700 mb-3">
                {t('cardKicker')}
              </div>
              <h3 className="font-serif text-[28px] lg:text-[30px] leading-tight -tracking-[0.012em] text-ink-900">
                {t('cardName')}
              </h3>
            </div>

            <InfoRow icon={<MapPin size={15} strokeWidth={1.7} />} label={t('addressLabel')}>
              {t('addressBody')}
            </InfoRow>
            <InfoRow icon={<Clock size={15} strokeWidth={1.7} />} label={t('hoursLabel')}>
              {t('hoursBody')}
            </InfoRow>
            <InfoRow icon={<Phone size={15} strokeWidth={1.7} />} label={t('contactLabel')}>
              {phoneHref && settings.contact_phone ? (
                <a href={phoneHref} className="hover:text-clay-700 transition-colors">
                  {settings.contact_phone}
                </a>
              ) : (
                '+1 809 724 3940'
              )}
            </InfoRow>

            <div className="flex flex-wrap gap-2.5 mt-1 pt-3 border-t border-sand-200">
              <a
                href={SLC_FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-ink-900 text-sand-50 text-[13px] font-medium hover:bg-clay-700 transition-colors"
              >
                <Facebook size={14} strokeWidth={1.8} />
                {t('ctaFacebook')}
              </a>
              <a
                href={SLC_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] border border-ink-900 text-ink-900 text-[13px] font-medium hover:bg-ink-900 hover:text-sand-50 transition-colors"
              >
                {t('ctaMaps')}
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 mt-0.5 text-clay-700">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-500 mb-0.5">
          {label}
        </div>
        <div className="text-[14.5px] text-ink-800 leading-[1.5]">{children}</div>
      </div>
    </div>
  )
}
