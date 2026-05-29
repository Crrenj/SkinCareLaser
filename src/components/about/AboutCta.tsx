import { SiWhatsapp } from 'react-icons/si'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getShopSettings, whatsappHref } from '@/lib/getShopSettings'

export async function AboutCta() {
  const t = await getTranslations('About.cta')
  const settings = await getShopSettings()
  const waHref = whatsappHref(settings.whatsapp_number)

  return (
    <section
      className="px-6 lg:px-10 py-20 lg:py-24 border-b border-ink-700 text-sand-100"
      style={{
        background:
          'radial-gradient(ellipse at 20% 100%, rgba(216,154,117,.16), transparent 60%), var(--color-ink-900)',
      }}
    >
      <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16 items-center">
        <div>
          <h2
            className="font-serif text-[44px] sm:text-[56px] lg:text-[72px] leading-none -tracking-[0.02em] text-sand-50 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-400"
            dangerouslySetInnerHTML={{ __html: t.raw('title') as string }}
          />
          <p className="font-serif text-[19px] lg:text-[21px] leading-[1.45] text-sand-300 my-7 max-w-[560px]">
            {t.rich('body', {
              strong: (chunks) => <strong className="font-semibold text-sand-50">{chunks}</strong>,
            })}
          </p>
          <div className="flex flex-wrap gap-3">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-[4px] bg-[#25D366] text-white font-medium text-[15px] hover:bg-[#1ebd5a] transition-colors"
              >
                <SiWhatsapp size={16} />
                {t('ctaWa')}
              </a>
            )}
            <Link
              href="/pharmacie"
              className="inline-flex items-center gap-2.5 px-6 py-4 rounded-[4px] bg-sand-50 text-ink-900 font-medium text-[15px] border border-sand-400 hover:border-ink-900 transition-colors"
            >
              {t('ctaVisit')}
            </Link>
          </div>
        </div>

        <aside className="bg-[rgba(251,248,244,.04)] border border-ink-700 p-8 rounded-[4px] font-mono text-[12px] tracking-[0.06em] leading-[1.7]">
          <div className="font-serif italic text-[22px] lg:text-[24px] text-clay-400 normal-case tracking-normal mb-4.5 leading-[1.2]">
            {t('cardTitle')}
          </div>
          <Row label={t('rowResponseLabel')} value={t('rowResponseValue')} />
          <Row label={t('rowLangsLabel')} value={t('rowLangsValue')} />
          <Row label={t('rowAvailLabel')} value={t('rowAvailValue')} />
          <Row label={t('rowByLabel')} value={t('rowByValue')} />
          <Row label={t('rowCostLabel')} value={t('rowCostValue')} last />
        </aside>
      </div>
    </section>
  )
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex justify-between py-2.5 text-sand-300 ${
        last ? 'border-b-0' : 'border-b border-ink-700'
      }`}
    >
      <span>{label}</span>
      <b className="text-sand-50 font-medium">{value}</b>
    </div>
  )
}
