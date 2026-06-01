'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Plate } from '@/components/ui/Plate'

interface HomeHeroProps {
  /** Nombre de produits actifs (méta « Références »). */
  productCount?: number
  /** Nombre de marques (méta « Maisons »). */
  brandCount?: number
}

/**
 * Hero éditorial statique (contrôlé par la marque, pas par le CMS) :
 * typo Instrument Serif à gauche, plaque image cadrée à droite, ligne de méta
 * sur filet en dessous. Zéro dégradé, zéro blob — l'italique clay est rationnée.
 */
export function HomeHero({ productCount, brandCount }: HomeHeroProps) {
  const t = useTranslations('Home.hero')

  return (
    <section className="border-b border-sand-300 bg-sand-50">
      <div className="mx-auto max-w-[1440px] px-[clamp(20px,6vw,104px)] pt-[clamp(40px,6vw,84px)]">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-[clamp(32px,5vw,72px)] items-center">
          {/* Copy */}
          <div>
            <div className="flex items-center gap-3 mb-7 font-mono text-[11.5px] uppercase tracking-[0.18em] text-ink-500">
              <span className="w-[5px] h-[5px] rounded-full bg-clay-700" />
              {t('kicker')}
            </div>
            <h1
              className="font-serif font-normal text-[clamp(52px,7.6vw,112px)] leading-[0.9] -tracking-[0.032em] text-ink-900 text-balance mb-7 [&_em]:italic [&_em]:text-clay-700"
              dangerouslySetInnerHTML={{ __html: t.raw('title') as string }}
            />
            <p className="text-[clamp(16px,1.4vw,19px)] leading-[1.6] text-ink-700 max-w-[46ch] mb-9">
              {t('description')}
            </p>
            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                href="/catalogue"
                className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-[2px] bg-clay-700 text-sand-50 text-[12.5px] font-semibold uppercase tracking-[0.06em] hover:bg-clay-800 transition-colors"
              >
                {t('primaryCta')}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/a-propos"
                className="inline-flex items-center px-5 py-3 rounded-[2px] border border-ink-900 text-ink-900 text-[12.5px] font-semibold uppercase tracking-[0.06em] hover:bg-ink-900 hover:text-sand-50 transition-colors"
              >
                {t('ghostCta')}
              </Link>
            </div>
          </div>

          {/* Art — plaque image (masquée sur mobile, comme la maquette) */}
          <div className="max-lg:hidden">
            <Plate mark className="aspect-[4/5] rounded-[3px]" />
          </div>
        </div>

        {/* Méta sur filet */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-sand-300 mt-[clamp(40px,6vw,72px)] pt-[clamp(28px,4vw,48px)] pb-[clamp(36px,5vw,56px)]">
          <HeroMeta k={t('meta.referencesK')} v={productCount != null ? String(productCount) : '—'} sub={t('meta.referencesSub')} />
          <HeroMeta k={t('meta.housesK')} v={brandCount != null ? String(brandCount) : '—'} sub={t('meta.housesSub')} />
          <HeroMeta k={t('meta.modelK')} v={t('meta.modelV')} sub={t('meta.modelSub')} />
          <HeroMeta k={t('meta.whereK')} v={t('meta.whereV')} />
        </div>
      </div>
    </section>
  )
}

function HeroMeta({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-500">{k}</span>
      <span className="font-serif text-[21px] leading-tight text-ink-900">
        {v}
        {sub && <small className="font-sans text-[13px] text-ink-500 ml-1.5">{sub}</small>}
      </span>
    </div>
  )
}
