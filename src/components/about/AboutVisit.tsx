import { SiWhatsapp } from 'react-icons/si'
import { getTranslations } from 'next-intl/server'
import { AboutSectionHead } from './AboutSectionHead'
import {
  getShopSettings,
  telHref,
  whatsappHref,
  mailtoHref,
} from '@/lib/getShopSettings'

const DIRECTIONS_URL =
  'https://maps.google.com/?q=Calle+Jesus+de+Galindez+Esq+Calle+3+Cerros+de+Gurabo+Santiago+Rep%C3%BAblica+Dominicana'

export async function AboutVisit() {
  const t = await getTranslations('About.visit')
  const settings = await getShopSettings()
  const phoneHref = telHref(settings.contact_phone)
  const waHref = whatsappHref(settings.whatsapp_number)
  const emailHref = mailtoHref(settings.contact_email)

  return (
    <section className="bg-sand-50 px-6 lg:px-10 py-20 lg:py-[120px] border-b border-sand-300">
      <div className="max-w-[1320px] mx-auto">
        <AboutSectionHead
          num={t('num')}
          eyebrow={t('eyebrow')}
          titleHtml={t.raw('title') as string}
          lede={t('lede')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-stretch">
          <div
            className="relative aspect-[4/3] rounded-[4px] border border-sand-400 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #E6E0D2 0%, #DDD4C2 100%)' }}
            aria-label={t('mapAlt')}
          >
            <svg
              className="w-full h-full block"
              viewBox="0 0 700 520"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden
            >
              <rect width="700" height="520" fill="#EDE5D2" />
              <rect x="60" y="80" width="220" height="120" fill="#D9D0BD" opacity="0.55" />
              <rect x="320" y="60" width="160" height="160" fill="#D9D0BD" opacity="0.45" />
              <rect x="520" y="100" width="140" height="180" fill="#D9D0BD" opacity="0.55" />
              <rect x="100" y="240" width="180" height="120" fill="#D9D0BD" opacity="0.5" />
              <rect x="320" y="260" width="140" height="100" fill="#D9D0BD" opacity="0.55" />
              <rect x="490" y="320" width="160" height="120" fill="#D9D0BD" opacity="0.45" />
              <line x1="0" y1="60" x2="700" y2="60" stroke="#FBF8F4" strokeWidth="3" />
              <line x1="0" y1="220" x2="700" y2="220" stroke="#FBF8F4" strokeWidth="5" />
              <line x1="0" y1="370" x2="700" y2="370" stroke="#FBF8F4" strokeWidth="3" />
              <line x1="0" y1="460" x2="700" y2="460" stroke="#FBF8F4" strokeWidth="3" />
              <line x1="50" y1="0" x2="50" y2="520" stroke="#FBF8F4" strokeWidth="3" />
              <line x1="300" y1="0" x2="300" y2="520" stroke="#FBF8F4" strokeWidth="5" />
              <line x1="490" y1="0" x2="490" y2="520" stroke="#FBF8F4" strokeWidth="3" />
              <line x1="660" y1="0" x2="660" y2="520" stroke="#FBF8F4" strokeWidth="3" />
              <line x1="0" y1="500" x2="700" y2="120" stroke="#FBF8F4" strokeWidth="6" />
              <text x="340" y="232" fontFamily="JetBrains Mono" fontSize="10" fill="#807969" letterSpacing="2">
                AV. ESTRELLA SADHALÁ
              </text>
              <text
                x="304"
                y="100"
                fontFamily="JetBrains Mono"
                fontSize="9"
                fill="#807969"
                letterSpacing="2"
                transform="rotate(90 304 100)"
              >
                CALLE DEL SOL
              </text>
              <text
                x="490"
                y="200"
                fontFamily="JetBrains Mono"
                fontSize="9"
                fill="#807969"
                letterSpacing="2"
                transform="rotate(90 490 200)"
              >
                CALLE GALÍNDEZ
              </text>
            </svg>
            <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-full flex flex-col items-center">
              <div className="relative w-[22px] h-[22px] rounded-full bg-clay-700 shadow-[0_0_0_6px_rgba(142,82,50,.18),0_6px_14px_rgba(31,27,22,.25)]">
                <span
                  aria-hidden
                  className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-[6px] border-transparent border-t-clay-700"
                />
              </div>
              <div className="mt-4.5 bg-sand-50 border border-sand-400 px-3.5 py-2 rounded-[3px] font-mono text-[11px] tracking-[0.1em] uppercase text-ink-800 whitespace-nowrap shadow-[0_4px_12px_rgba(31,27,22,.1)]">
                {t('pinLabel')}{settings.pickup_address ? ` · ${settings.pickup_address.split(',')[0]}` : ''}
              </div>
            </div>
          </div>

          <div className="bg-sand-50 border border-sand-300 p-9 lg:p-11 flex flex-col gap-6">
            <h3
              className="font-serif text-[32px] lg:text-[36px] leading-none -tracking-[0.015em] text-ink-900 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-700"
              dangerouslySetInnerHTML={{ __html: t.raw('infoTitle') as string }}
            />

            <Block label={t('addressLabel')}>
              <p className="font-serif text-[19px] leading-[1.45] text-ink-900">
                {settings.pickup_address || 'Calle Jesús de Galíndez Esq. Calle 3'}
                <small className="block font-sans text-[13px] text-ink-500 mt-1">
                  Santiago de los Caballeros · República Dominicana
                </small>
              </p>
            </Block>

            <Block label={t('hoursLabel')}>
              <dl className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-4 text-[14.5px] text-ink-800">
                <dt className="text-ink-500">{t('hoursMonFri')}</dt>
                <dd className="m-0">{t('hoursMonFriValue')}</dd>
                <dt className="text-ink-500">{t('hoursSat')}</dt>
                <dd className="m-0">{t('hoursSatValue')}</dd>
                <dt className="text-ink-500">{t('hoursSun')}</dt>
                <dd className="m-0 text-brick-600">{t('hoursSunValue')}</dd>
                <dt className="text-ink-500">{t('hoursHolidays')}</dt>
                <dd className="m-0">{t('hoursHolidaysValue')}</dd>
              </dl>
            </Block>

            <Block label={t('contactLabel')}>
              <p className="font-serif text-[16px] leading-[1.45] text-ink-900">
                {phoneHref && settings.contact_phone ? (
                  <a
                    href={phoneHref}
                    className="hover:text-clay-700 transition-colors"
                  >
                    {settings.contact_phone}
                  </a>
                ) : (
                  '+1 809 724 3940'
                )}
                {emailHref && settings.contact_email && (
                  <small className="block font-sans text-[13px] text-ink-500 mt-1">
                    <a
                      href={emailHref}
                      className="hover:text-clay-700 transition-colors"
                    >
                      {settings.contact_email}
                    </a>
                  </small>
                )}
              </p>
            </Block>

            <div className="flex flex-wrap gap-3 mt-auto pt-3">
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-[4px] bg-[#25D366] text-white font-medium text-[14px] hover:bg-[#1ebd5a] transition-colors"
                >
                  <SiWhatsapp size={16} />
                  {t('ctaWa')}
                </a>
              )}
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-[4px] border border-ink-900 text-ink-900 font-medium text-[14px] hover:bg-ink-900 hover:text-sand-50 transition-colors"
              >
                {t('ctaDirections')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-sand-300 pt-5">
      <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500 mb-2.5">
        {label}
      </div>
      {children}
    </div>
  )
}
