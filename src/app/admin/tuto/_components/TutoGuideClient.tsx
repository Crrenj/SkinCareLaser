'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronsDownUp, ChevronsUpDown, Search, X } from 'lucide-react'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import type { TutoContent, TutoSectionId } from '../_content/types'
import { TutoSectionCard } from './TutoSectionCard'
import { TutoQueryCtx, countHits, deburr, sectionSearchText } from './tutoSearch'

/**
 * Guide du panneau — refonte « Admin Tuto - Redesign » :
 * sommaire collant groupé par thème avec recherche plein-texte (filtre les
 * sections, surligne les occurrences, compteur par section), cartes de
 * sections repliées sur leur résumé, tout déplier/replier, scrollspy, ancres.
 */

function LegendCard({ tone, label, desc }: { tone: 'safe' | 'caution' | 'danger'; label: string; desc: string }) {
  const cls = {
    safe: { box: 'border-olive-200 bg-olive-50', dot: 'bg-olive-600' },
    caution: { box: 'border-ochre-200 bg-ochre-200/30', dot: 'bg-ochre-600' },
    danger: { box: 'border-brick-200 bg-brick-50', dot: 'bg-brick-600' },
  }[tone]
  return (
    <div className={`rounded-lg border px-[13px] py-2.5 ${cls.box}`}>
      <p className="flex items-center gap-[7px] text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-900">
        <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${cls.dot}`} />
        {label}
      </p>
      <p className="mt-1 text-[12.5px] leading-[1.5] text-ink-700">{desc}</p>
    </div>
  )
}

export function TutoGuideClient({ content }: { content: TutoContent }) {
  const t = useTranslations('Admin.tuto')
  const sections = content.sections
  const [query, setQuery] = useState('')
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({})
  // Surcharges pendant une recherche (les sections qui matchent s'ouvrent
  // d'elles-mêmes, mais restent repliables) — remises à zéro à chaque requête.
  const [searchOverride, setSearchOverride] = useState<Record<string, boolean>>({})
  const [activeId, setActiveId] = useState<TutoSectionId>(sections[0].id)

  const indexOf = useMemo(() => new Map(sections.map((s, i) => [s.id, i + 1])), [sections])
  const searchText = useMemo(
    () => new Map(sections.map((s) => [s.id, sectionSearchText(s, content.summaries[s.id])])),
    [sections, content.summaries],
  )
  const totalActions = useMemo(() => sections.reduce((n, s) => n + s.actions.length, 0), [sections])

  const dq = deburr(query.trim())
  const searching = dq.length >= 2

  const results = useMemo(() => {
    const r = new Map<TutoSectionId, number>()
    if (!searching) return r
    sections.forEach((s) => r.set(s.id, countHits(searchText.get(s.id) ?? '', dq)))
    return r
  }, [dq, searching, sections, searchText])

  const matchedSections = searching ? sections.filter((s) => (results.get(s.id) ?? 0) > 0) : sections
  const totalHits = searching ? sections.reduce((n, s) => n + (results.get(s.id) ?? 0), 0) : 0

  const isOpen = (id: TutoSectionId) =>
    searching ? (searchOverride[id] ?? (results.get(id) ?? 0) > 0) : (openMap[id] ?? false)
  const toggle = (id: TutoSectionId) =>
    searching
      ? setSearchOverride((m) => ({ ...m, [id]: !isOpen(id) }))
      : setOpenMap((m) => ({ ...m, [id]: !isOpen(id) }))
  const setAll = (v: boolean) => {
    const all = Object.fromEntries(sections.map((s) => [s.id, v]))
    if (searching) setSearchOverride(all)
    else setOpenMap(all)
  }

  // Nouvelle requête → on repart de l'état automatique (matches ouverts)
  useEffect(() => {
    setSearchOverride({})
  }, [dq])

  // Scrollspy : dernière section dont le haut a dépassé le repère
  useEffect(() => {
    let raf: number | null = null
    const onScroll = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(() => {
        raf = null
        let current: TutoSectionId | null = null
        for (const s of sections) {
          const el = document.getElementById(`sec-${s.id}`)
          if (!el || el.offsetParent === null) continue
          if (el.getBoundingClientRect().top <= 150) current = s.id
        }
        if (current) setActiveId(current)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [sections, searching])

  const navTo = (id: TutoSectionId) => {
    if (!isOpen(id)) {
      if (searching) setSearchOverride((m) => ({ ...m, [id]: true }))
      else setOpenMap((m) => ({ ...m, [id]: true }))
    }
    requestAnimationFrame(() => {
      const el = document.getElementById(`sec-${id}`)
      if (!el) return
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' })
      history.replaceState(null, '', `#${id}`)
    })
  }

  // Ancre au chargement (#section)
  useEffect(() => {
    const id = window.location.hash.replace('#', '') as TutoSectionId
    if (id && sections.some((s) => s.id === id)) {
      setOpenMap((m) => ({ ...m, [id]: true }))
      setTimeout(() => {
        const el = document.getElementById(`sec-${id}`)
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96 })
      }, 120)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TutoQueryCtx.Provider value={searching ? query.trim() : ''}>
      <PageHeader
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: t('crumb') }]}
        title={t('title')}
        actions={
          <>
            <span className="hidden font-mono text-[10.5px] tracking-[0.04em] text-ink-500 xl:inline">
              {t('statsLine', { sections: sections.length, actions: totalActions })}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-sand-300 px-3 py-[7px] text-[12.5px] leading-[1.2] text-ink-700 transition-colors hover:bg-sand-100 hover:text-ink-900"
              onClick={() => setAll(true)}
            >
              <ChevronsUpDown aria-hidden className="h-[13px] w-[13px]" strokeWidth={2} />
              {t('expandAll')}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-sand-300 px-3 py-[7px] text-[12.5px] leading-[1.2] text-ink-700 transition-colors hover:bg-sand-100 hover:text-ink-900"
              onClick={() => setAll(false)}
            >
              <ChevronsDownUp aria-hidden className="h-[13px] w-[13px]" strokeWidth={2} />
              {t('collapseAll')}
            </button>
          </>
        }
      />

      <div className="min-h-[calc(100vh-90px)] bg-sand-100 px-5 py-6 lg:px-7 lg:py-7">
        <div className="grid items-start gap-5 lg:grid-cols-[252px_minmax(0,1fr)] lg:gap-9">
          {/* Sommaire */}
          <nav
            aria-label={t('tocTitle')}
            className="lg:sticky lg:top-[102px] lg:max-h-[calc(100vh-126px)] lg:overflow-y-auto lg:pb-4 lg:pr-1.5"
          >
            <div className="relative mb-1.5">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
                strokeWidth={2}
              />
              <input
                type="search"
                value={query}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="w-full rounded-lg border border-sand-300 bg-sand-50 py-[9px] pl-8 pr-[30px] text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-clay-600 focus:shadow-[0_0_0_3px_rgba(184,111,74,0.14)]"
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 grid -translate-y-1/2 place-items-center rounded p-1 text-ink-400 hover:bg-sand-200 hover:text-ink-900"
                  aria-label={t('searchClear')}
                  onClick={() => setQuery('')}
                >
                  <X aria-hidden className="h-[13px] w-[13px]" strokeWidth={2} />
                </button>
              )}
            </div>
            {searching && (
              <p role="status" className="mb-1 ml-1 font-mono text-[10px] tracking-[0.04em] text-ink-500">
                {t('searchStatus', { hits: totalHits, sections: matchedSections.length })}
              </p>
            )}
            {content.groups.map((g) => (
              <div key={g.label}>
                <p className="px-2 pb-[5px] pt-4 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  {g.label}
                </p>
                <ol className="flex flex-row flex-wrap gap-x-1.5 gap-y-0.5 lg:flex-col lg:gap-0">
                  {g.ids.map((id) => {
                    const s = sections.find((x) => x.id === id)
                    if (!s) return null
                    const count = results.get(id) ?? 0
                    const dim = searching && count === 0
                    const on = activeId === id && !dim
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          disabled={dim}
                          className={`flex w-full items-baseline gap-2 rounded-md border-l-2 px-2 py-[5px] text-left text-[13px] leading-[1.35] lg:rounded-l-none lg:rounded-r-md ${
                            dim
                              ? 'border-transparent text-ink-700 opacity-40'
                              : on
                                ? 'border-clay-700 bg-sand-50 font-medium text-ink-900'
                                : 'border-transparent text-ink-700 hover:bg-sand-200 hover:text-ink-900'
                          }`}
                          onClick={() => navTo(id)}
                        >
                          <span className="shrink-0 font-mono text-[9.5px] font-semibold text-clay-700">
                            {String(indexOf.get(id)).padStart(2, '0')}
                          </span>
                          {s.navLabel}
                          {searching && count > 0 && (
                            <span className="ml-auto shrink-0 rounded-full bg-clay-700 px-1.5 py-px font-mono text-[9.5px] text-sand-50">
                              {count}
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))}
          </nav>

          {/* Colonne principale (le landmark <main> est posé par _AdminShell) */}
          <div className="grid gap-[18px]">
            {!searching && (
              <div className="rounded-xl border border-sand-300 bg-sand-50 px-[26px] py-[22px]">
                <h2 className="mb-2 font-serif text-[23px] font-normal text-ink-900">{content.intro.title}</h2>
                {content.intro.body.map((p, i) => (
                  <p key={i} className="mb-2 max-w-[78ch] text-[13.5px] leading-[1.6] text-ink-700">
                    {p}
                  </p>
                ))}
                <div className="mt-3.5 grid gap-2.5 sm:grid-cols-3">
                  <LegendCard tone="safe" label={t('severitySafe')} desc={content.intro.severityLegend.safe} />
                  <LegendCard tone="caution" label={t('severityCaution')} desc={content.intro.severityLegend.caution} />
                  <LegendCard tone="danger" label={t('severityDanger')} desc={content.intro.severityLegend.danger} />
                </div>
              </div>
            )}

            {matchedSections.map((s) => (
              <TutoSectionCard
                key={s.id}
                section={s}
                summary={content.summaries[s.id]}
                index={indexOf.get(s.id) ?? 0}
                open={isOpen(s.id)}
                onToggle={() => toggle(s.id)}
                searching={searching}
              />
            ))}

            {searching && matchedSections.length === 0 && (
              <div className="px-5 py-[60px] text-center text-ink-500">
                <p className="mb-1.5 font-serif text-[20px] text-ink-700">{t('emptyTitle', { query: query.trim() })}</p>
                <span className="text-[13px]">{t('emptyHint')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </TutoQueryCtx.Provider>
  )
}
