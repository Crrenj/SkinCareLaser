import { getTranslations } from 'next-intl/server'

export async function AboutStats() {
  const t = await getTranslations('About.stats')

  return (
    <section
      aria-label={t('ariaLabel')}
      className="bg-ink-900 text-sand-100 px-6 lg:px-10 py-9"
    >
      <div className="max-w-[1320px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-7 lg:gap-10">
        <Stat value={t('yearsValue')} suffix={t('yearsSuffix')} label={t('yearsLabel')} />
        <Stat value={t('brandsValue')} valueIsEm label={t('brandsLabel')} />
        <Stat value={t('refsValue')} label={t('refsLabel')} />
        <Stat value={t('teamValue')} valueIsEm label={t('teamLabel')} />
      </div>
    </section>
  )
}

function Stat({
  value,
  suffix,
  label,
  valueIsEm = false,
}: {
  value: string
  suffix?: string
  label: string
  valueIsEm?: boolean
}) {
  return (
    <div>
      <div className="font-serif text-[44px] lg:text-[56px] leading-none -tracking-[0.02em] text-sand-50">
        {valueIsEm ? <span className="italic text-clay-400">{value}</span> : value}
        {suffix && (
          <sup className="text-[22px] lg:text-[28px] align-super ml-1 text-clay-400">{suffix}</sup>
        )}
      </div>
      <div className="font-mono text-[11px] text-sand-400 tracking-[0.14em] uppercase mt-2.5">
        {label}
      </div>
    </div>
  )
}
