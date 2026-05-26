'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

type Props = {
  visible: number
  total: number
  activeCount: number
}

export function CatalogueHeader({ visible, total, activeCount }: Props) {
  const t = useTranslations('Catalogue')

  return (
    <section
      className="px-5 lg:px-10 pt-12 lg:pt-16 pb-9 border-b border-sand-300"
      style={{
        background:
          'radial-gradient(ellipse at 88% 18%, rgba(216,154,117,.13), transparent 55%), linear-gradient(180deg, var(--color-sand-100), var(--color-sand-50))',
      }}
    >
      <div className="max-w-[1480px] mx-auto">
        <nav
          aria-label={t('breadcrumbAriaLabel')}
          className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink-500 flex gap-2.5 items-center mb-7"
        >
          <Link href="/" className="hover:text-clay-700 transition-colors">
            {t('breadcrumbHome')}
          </Link>
          <span aria-hidden className="text-sand-400">
            /
          </span>
          <span className="text-clay-700">{t('breadcrumbCurrent')}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_auto] gap-6 lg:gap-8 items-end">
          <div>
            <h1
              className="font-serif text-[48px] sm:text-[64px] lg:text-[88px] leading-none -tracking-[0.02em] text-ink-900 [&_em]:not-italic [&_em]:italic [&_em]:text-clay-700"
              dangerouslySetInnerHTML={{ __html: t.raw('headerTitle') as string }}
            />
            <p className="font-serif text-[19px] lg:text-[21px] leading-[1.45] text-ink-700 mt-5 max-w-[580px]">
              {t('headerSubtitle', { count: total })}
            </p>
          </div>
          <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-500 text-left lg:text-right leading-[1.7]">
            <span className="font-serif text-[44px] lg:text-[60px] leading-none -tracking-[0.02em] text-ink-900 block mb-1.5">
              {visible}
            </span>
            <b className="text-ink-800 font-medium">{t('headerMetaProducts')}</b>
            <br />
            {t('headerMetaOf', { total })}
            {activeCount > 0 && (
              <>
                <br />
                <span className="text-clay-700">
                  {t('headerMetaActive', { count: activeCount })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
