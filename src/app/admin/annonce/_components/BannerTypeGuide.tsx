'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import type { BannerType } from '../_lib/types'

const TYPES = ['editorial', 'hero', 'quote'] as const

const zoneLabel = 'font-mono text-[8px] uppercase tracking-wide leading-none'

/**
 * Aide intégrée au modal d'édition : trois schémas annotés des types de
 * bannière disponibles (le type courant est surligné) + une légende
 * « quoi va où » qui relie chaque champ du formulaire à sa zone rendue.
 * Purement illustratif (wireframes), aucune donnée réelle.
 */
export function BannerTypeGuide({ selected }: { selected?: BannerType }) {
  const t = useTranslations('Admin.modals.banner.guide')
  const active = TYPES.find((x) => x === selected)

  const card = (type: (typeof TYPES)[number], schematic: ReactNode) => (
    <div
      className={`rounded-lg border p-2 transition-colors ${
        active === type ? 'border-clay-700 bg-clay-50' : 'border-sand-200 bg-sand-50'
      }`}
    >
      <div className="h-16">{schematic}</div>
      <div
        className={`mt-1.5 text-center font-mono text-[10px] uppercase tracking-[0.1em] capitalize ${
          active === type ? 'text-clay-800' : 'text-ink-500'
        }`}
      >
        {type}
      </div>
    </div>
  )

  const rows: Array<[string, string]> = [
    [t('fieldTitle'), t('mapTitle')],
    [t('fieldDescription'), t('mapDescription')],
    [t('fieldImage'), t('mapImage')],
    [t('fieldCta'), t('mapCta')],
    [t('fieldDirection'), t('mapDirection')],
    [t('fieldAttribution'), t('mapAttribution')],
  ]

  return (
    <section className="mt-1 rounded-xl border border-sand-200 bg-sand-100/50 p-[18px]">
      <div className="font-serif text-[17px] text-ink-900 mb-3">{t('heading')}</div>

      <div className="grid grid-cols-3 gap-2">
        {card(
          'editorial',
          <div className="flex h-full gap-1">
            <div className="grid w-[42%] place-items-center rounded border border-sand-300 bg-sand-200">
              <span className={`${zoneLabel} text-ink-500`}>{t('zoneImage')}</span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1">
              <div className="h-2 w-4/5 rounded-sm bg-ink-800" />
              <div className="h-1 w-full rounded-sm bg-ink-300" />
              <div className="h-1 w-2/3 rounded-sm bg-ink-300" />
              <div className="mt-0.5 grid h-3 w-3/5 place-items-center rounded-sm bg-clay-700">
                <span className={`${zoneLabel} text-sand-50`}>{t('zoneCta')}</span>
              </div>
            </div>
          </div>,
        )}

        {card(
          'hero',
          <div className="relative grid h-full place-items-center overflow-hidden rounded bg-ink-800">
            <span className={`absolute left-1 top-1 ${zoneLabel} text-sand-50/50`}>{t('zoneImageBg')}</span>
            <div className="flex w-full flex-col items-center gap-1 px-3">
              <div className="h-2 w-3/5 rounded-sm bg-sand-50" />
              <div className="h-1 w-2/5 rounded-sm bg-sand-50/60" />
              <div className="mt-0.5 grid h-3 w-1/2 place-items-center rounded-sm bg-clay-600">
                <span className={`${zoneLabel} text-sand-50`}>{t('zoneCta')}</span>
              </div>
            </div>
          </div>,
        )}

        {card(
          'quote',
          <div className="relative flex h-full flex-col justify-center gap-1 rounded bg-ink-900 px-2 py-1.5">
            <span className="absolute left-1 top-0 font-serif text-lg leading-none text-sand-50/30">“</span>
            <div className="h-1.5 w-full rounded-sm bg-sand-50/80" />
            <div className="h-1.5 w-3/4 rounded-sm bg-sand-50/80" />
            <div className="mt-1 flex items-center gap-1">
              <span className="h-3 w-3 shrink-0 rounded-full bg-sand-50/40" />
              <span className={`${zoneLabel} text-sand-50/60`}>{t('zoneAttribution')}</span>
            </div>
          </div>,
        )}
      </div>

      <div className="mt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
        {t('mappingHeading')}
      </div>
      <ul className="mt-1.5 flex flex-col gap-1 text-[12px] leading-snug">
        {rows.map(([field, desc]) => (
          <li key={field}>
            <span className="font-semibold text-ink-900">{field}</span>
            <span className="text-ink-400"> → </span>
            <span className="text-ink-600">{desc}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
