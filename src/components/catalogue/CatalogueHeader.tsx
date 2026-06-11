'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

type Props = {
  visible: number
  total: number
  activeCount: number
}

/**
 * En-tête compact éditorial (redesign « Rail editorial » 2026-06-11) :
 * titre serif ~38px sur UNE ligne (fini le 88px), sous-titre serif court,
 * méta chiffrée à droite (compteur serif 30px + filtres actifs).
 */
export function CatalogueHeader({ visible, total, activeCount }: Props) {
  const t = useTranslations('Catalogue')

  return (
    <section
      className="px-5 lg:px-10 pt-6 lg:pt-7 pb-[22px] border-b border-sand-300"
      style={{
        background:
          'radial-gradient(ellipse at 92% 10%, rgba(216,154,117,.10), transparent 60%), linear-gradient(180deg, var(--color-sand-100), var(--color-sand-50))',
      }}
    >
      <div className="max-w-[1480px] mx-auto">
        <nav
          aria-label={t('breadcrumbAriaLabel')}
          className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-500 flex gap-2 items-center mb-3.5"
        >
          <Link href="/" className="hover:text-clay-700 transition-colors">
            {t('breadcrumbHome')}
          </Link>
          <span aria-hidden className="text-sand-400">
            /
          </span>
          <span className="text-clay-700">{t('breadcrumbCurrent')}</span>
        </nav>

        <div className="flex justify-between items-end gap-7 flex-wrap">
          <div>
            <h1
              className="font-serif text-[30px] lg:text-[38px] leading-[1.04] -tracking-[0.015em] text-ink-900 [&_em]:italic [&_em]:text-clay-700"
              dangerouslySetInnerHTML={{ __html: t.raw('headerTitle') as string }}
            />
            <p className="font-serif text-[17px] leading-[1.4] text-ink-700 mt-[7px] max-w-[520px]">
              {t('headerSubtitle')}
            </p>
          </div>
          <div className="font-mono text-[11px] tracking-[0.04em] text-ink-500 text-right leading-[1.7] whitespace-nowrap">
            <span className="font-serif text-[30px] leading-none -tracking-[0.02em] text-ink-900">
              {visible}
            </span>
            <br />
            <b className="text-ink-800 font-medium">{t('headerMetaProducts')}</b>{' '}
            · {t('headerMetaOf', { total })}
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
