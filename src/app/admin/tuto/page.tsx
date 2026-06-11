import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import type { TutoContent } from './_content/types'
import { fr } from './_content/fr'
import { es } from './_content/es'
import { en } from './_content/en'
import { TutoSectionView, type TutoChromeLabels } from './_components/TutoSectionView'

export const metadata: Metadata = {
  title: 'Guía · Admin · FARMAU',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// Le corps du guide vit dans des fichiers par locale (modèle pages légales) ;
// le compilateur garantit la parité de structure entre les trois langues.
const CONTENT: Record<string, TutoContent> = { fr, es, en }

export default async function AdminTutoPage() {
  const locale = await getLocale()
  const t = await getTranslations('Admin.tuto')
  const content = CONTENT[locale] ?? CONTENT.fr

  const labels: TutoChromeLabels = {
    openScreen: t('openScreen'),
    legend: t('legend'),
    workflowsHeading: t('workflowsHeading'),
    actionsHeading: t('actionsHeading'),
    gotchasHeading: t('gotchasHeading'),
    severity: {
      safe: t('severitySafe'),
      caution: t('severityCaution'),
      danger: t('severityDanger'),
    },
    undoLabel: t('undoLabel'),
    noUndo: t('noUndo'),
    audited: t('auditedBadge'),
    publicSite: t('publicBadge'),
    accounting: t('accountingBadge'),
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: t('crumb') }]}
        title={t('title')}
      />
      <div className="bg-sand-100 px-5 lg:px-8 py-6 lg:py-7 min-h-[calc(100vh-90px)]">
        <div className="mx-auto max-w-[1240px]">
          {/* Introduction + légende des risques */}
          <div className="mb-6 rounded-md border border-sand-300 bg-sand-50 px-5 py-5">
            <h2 className="font-serif text-[24px] text-ink-900">{content.intro.title}</h2>
            <div className="mt-2 grid max-w-[820px] gap-2">
              {content.intro.body.map((p, i) => (
                <p key={i} className="text-[14px] leading-relaxed text-ink-700">
                  {p}
                </p>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <LegendCard tone="safe" label={labels.severity.safe} desc={content.intro.severityLegend.safe} />
              <LegendCard tone="caution" label={labels.severity.caution} desc={content.intro.severityLegend.caution} />
              <LegendCard tone="danger" label={labels.severity.danger} desc={content.intro.severityLegend.danger} />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[218px_minmax(0,1fr)] items-start">
            {/* Sommaire */}
            <nav aria-label={t('tocTitle')} className="lg:sticky lg:top-6">
              <p className="mb-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {t('tocTitle')}
              </p>
              <ol className="flex flex-row flex-wrap gap-x-3 gap-y-1 lg:flex-col lg:gap-y-0.5">
                {content.sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="inline-flex items-baseline gap-2 rounded-md px-2 py-1 text-[13px] text-ink-700 transition-colors hover:bg-sand-200 hover:text-ink-900"
                    >
                      <span className="font-mono text-[10px] font-semibold text-clay-700">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {s.navLabel}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Sections */}
            <div className="grid gap-8">
              {content.sections.map((section, i) => (
                <TutoSectionView key={section.id} section={section} index={i + 1} labels={labels} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const LEGEND_CLS: Record<'safe' | 'caution' | 'danger', { box: string; dot: string }> = {
  safe: { box: 'border-olive-200 bg-olive-50', dot: 'bg-olive-600' },
  caution: { box: 'border-ochre-200 bg-ochre-200/30', dot: 'bg-ochre-600' },
  danger: { box: 'border-brick-200 bg-brick-50', dot: 'bg-brick-600' },
}

function LegendCard({
  tone,
  label,
  desc,
}: {
  tone: 'safe' | 'caution' | 'danger'
  label: string
  desc: string
}) {
  const cls = LEGEND_CLS[tone]
  return (
    <div className={`rounded-md border px-3.5 py-3 ${cls.box}`}>
      <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-900">
        <span className={`h-2 w-2 rounded-full ${cls.dot}`} />
        {label}
      </p>
      <p className="mt-1 text-[12.5px] leading-snug text-ink-700">{desc}</p>
    </div>
  )
}
