'use client'

import { createContext, useContext, Fragment } from 'react'
import type { TutoAction, TutoSection } from '../_content/types'

/**
 * Recherche plein-texte du guide : normalisation accent-insensible à longueur
 * préservée (les offsets de surlignage restent valides), comptage
 * d'occurrences et composant de surlignage <mark>.
 */

/** Requête de recherche active ('' = pas de recherche). */
export const TutoQueryCtx = createContext('')

/** Minuscules + sans accents, longueur UTF-16 préservée (offsets de surlignage valides). */
export function deburr(s: string): string {
  return Array.from(String(s))
    .map((c) => {
      const n = (c.normalize('NFD').replace(/[̀-ͯ]/g, '') || c).toLowerCase()
      // un code point astral (emoji…) fait 2 unités UTF-16 : ne jamais le tronquer
      if (n.length === c.length) return n
      return n.length > c.length ? n.slice(0, c.length) : c
    })
    .join('')
}

/** Nombre d'occurrences (non chevauchantes) de `dq` dans un texte déjà deburr. */
export function countHits(haystackDeburred: string, dq: string): number {
  if (!dq) return 0
  let n = 0
  let i = 0
  for (;;) {
    const j = haystackDeburred.indexOf(dq, i)
    if (j === -1) return n
    n += 1
    i = j + dq.length
  }
}

/** Texte agrégé d'une action (pour la recherche et l'auto-ouverture). */
export function actionSearchText(a: TutoAction): string {
  return [a.label, a.where, a.does, ...a.effects, a.undo ?? '', a.publicImpact ?? '', a.accountingImpact ?? ''].join(
    ' \n ',
  )
}

/** Texte agrégé d'une section (titre, intro, résumé, schéma, flux, actions…). */
export function sectionSearchText(s: TutoSection, summary: string): string {
  const parts: string[] = [s.title, s.navLabel, s.intro, summary]
  s.hotspots?.forEach((h) => parts.push(h.label, h.desc))
  s.flows?.forEach((f) => {
    parts.push(f.title)
    f.lanes.forEach((lane) =>
      lane.forEach((n) => {
        parts.push(n.label)
        if (n.note) parts.push(n.note)
      }),
    )
  })
  s.workflows?.forEach((w) => {
    parts.push(w.title)
    w.steps.forEach((st) => parts.push(st.title, st.body))
  })
  s.actions.forEach((a) => parts.push(actionSearchText(a)))
  s.gotchas?.forEach((g) => parts.push(g))
  return deburr(parts.join(' \n '))
}

/** Surligne les occurrences de la recherche courante dans un texte. */
export function Hl({ t }: { t?: string }) {
  const q = useContext(TutoQueryCtx)
  if (!t) return null
  if (!q) return <>{t}</>
  const dq = deburr(q)
  const dt = deburr(t)
  if (!dt.includes(dq)) return <>{t}</>
  const parts: React.ReactNode[] = []
  let i = 0
  for (;;) {
    const j = dt.indexOf(dq, i)
    if (j === -1) {
      parts.push(t.slice(i))
      break
    }
    if (j > i) parts.push(t.slice(i, j))
    parts.push(
      <mark key={j} className="rounded-[2px] bg-ochre-200/80 px-px text-inherit">
        {t.slice(j, j + dq.length)}
      </mark>,
    )
    i = j + dq.length
  }
  return <Fragment>{parts}</Fragment>
}
