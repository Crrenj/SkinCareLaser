'use client'

import { useTranslations } from 'next-intl'

export interface PdpAccordionData {
  description?: string
  benefits?: string[]
  usage?: string
  inci?: string
  technicalPdfUrl?: string
  technical?: { label: string; value: string }[]
}

interface PdpAccordionsProps {
  data: PdpAccordionData
}

/**
 * Cinq accordéons natifs <details> :
 *   1. Description (ouvert par défaut)
 *   2. Bénéfices (si product.benefits)
 *   3. Mode d'emploi (si product.usage)
 *   4. Composition · INCI (si product.inci)
 *   5. Fiche technique (si product.technical ou pdf)
 *
 * Tout est rendu côté serveur — pas d'état React, contenu indexable.
 */
export function PdpAccordions({ data }: PdpAccordionsProps) {
  const t = useTranslations('Product.accordions')

  const inciCount = data.inci
    ? data.inci.split(',').filter((s) => s.trim().length > 0).length
    : 0

  const readMinutes = data.description
    ? Math.max(1, Math.round(data.description.split(/\s+/).length / 200))
    : null

  return (
    <section className="bg-sand-50 border-t border-sand-200 py-16 px-8">
      <div className="max-w-[920px] mx-auto">
        {data.description && (
          <Accordion
            title={t('description')}
            meta={readMinutes ? t('descriptionMeta', { min: readMinutes }) : undefined}
            defaultOpen
          >
            {data.description.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </Accordion>
        )}

        {data.benefits && data.benefits.length > 0 && (
          <Accordion title={t('benefits')}>
            <ul className="list-none p-0 m-0">
              {data.benefits.map((b, i) => (
                <li
                  key={i}
                  className="py-2 pl-6 relative text-sm text-ink-800 leading-snug border-b border-dashed border-sand-300 last:border-b-0"
                >
                  <span aria-hidden className="absolute left-0 text-clay-600">→</span>
                  {b}
                </li>
              ))}
            </ul>
          </Accordion>
        )}

        {data.usage && (
          <Accordion title={t('usage')}>
            {data.usage.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </Accordion>
        )}

        {data.inci && (
          <Accordion
            title={t('composition')}
            meta={inciCount > 0 ? t('compositionMeta', { count: inciCount }) : undefined}
          >
            <div className="bg-sand-100 p-4 rounded-sm font-mono text-[11.5px] leading-relaxed text-ink-700 break-words">
              <strong className="text-clay-700 font-semibold">{t('inciLabel')}</strong>{' '}
              {data.inci}
            </div>
          </Accordion>
        )}

        {(data.technical && data.technical.length > 0) || data.technicalPdfUrl ? (
          <Accordion title={t('technical')}>
            {data.technical && data.technical.length > 0 && (
              <ul className="list-none p-0 m-0 grid grid-cols-1 md:grid-cols-2 gap-x-8 mb-4">
                {data.technical.map((spec, i) => (
                  <li
                    key={i}
                    className="py-2 pl-6 relative text-sm text-ink-800 leading-snug border-b border-dashed border-sand-300 last:border-b-0"
                  >
                    <span aria-hidden className="absolute left-0 text-clay-600">→</span>
                    <strong className="text-ink-900 font-semibold">{spec.label}</strong> · {spec.value}
                  </li>
                ))}
              </ul>
            )}
            {data.technicalPdfUrl && (
              <a
                href={data.technicalPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-clay-700 hover:text-clay-800 text-[13.5px] font-medium pt-1.5"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {t('downloadPdf')}
              </a>
            )}
          </Accordion>
        ) : null}
      </div>
    </section>
  )
}

function Accordion({
  title,
  meta,
  children,
  defaultOpen,
}: {
  title: string
  meta?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      className="border-t border-sand-300 last:border-b last:border-b-sand-300 group"
      open={defaultOpen}
    >
      <summary className="list-none cursor-pointer py-5 flex justify-between items-center font-serif text-[26px] text-ink-900 -tracking-[0.01em] select-none">
        <span className="flex items-baseline gap-3">
          {title}
          {meta && (
            <span className="font-sans text-[11px] text-ink-500 uppercase tracking-widest font-medium">
              {meta}
            </span>
          )}
        </span>
        <Chevron />
      </summary>
      <div className="pb-7 text-[15px] leading-relaxed text-ink-800 max-w-[760px] space-y-3.5">
        {children}
      </div>
    </details>
  )
}

function Chevron() {
  return (
    <span
      aria-hidden
      className="relative inline-block w-3.5 h-3.5 ml-3 text-ink-700 transition-transform duration-200 group-open:rotate-45"
    >
      <span className="absolute left-0 top-1/2 w-3.5 h-px bg-current -translate-y-1/2" />
      <span className="absolute left-1/2 top-0 w-px h-3.5 bg-current -translate-x-1/2 transition-opacity duration-200 group-open:opacity-0" />
    </span>
  )
}
