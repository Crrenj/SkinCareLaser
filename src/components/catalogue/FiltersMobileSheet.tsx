'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { FilterState } from '@/lib/catalogueFilters'

type TagTypeKey = 'categories' | 'besoins' | 'typesPeau' | 'ingredients'

const TAG_TYPE_TRANSLATION: Record<string, TagTypeKey> = {
  categories: 'categories',
  besoins: 'besoins',
  'types-peau': 'typesPeau',
  ingredients: 'ingredients',
}

type Props = {
  open: boolean
  onClose: () => void

  /** Compteur produits matchant les filtres provisoires (live). */
  matchedCount: number

  /** Données du catalogue. */
  availableBrands: string[]
  itemsByType: Record<string, string[]>

  /** Sélections actuelles. */
  sort: string
  selectedBrands: Set<string>
  selectedTags: Record<string, Set<string>>

  /** Handlers (déjà câblés sur le state du parent). */
  onSortChange: (sort: string) => void
  onBrandToggle: (brand: string) => void
  onTagToggle: (tagType: string, tagName: string) => void
  onClearAll: () => void

  /**
   * Snapshot/restore de l'état COMPLET des filtres pour le Cancel : restaurer
   * en un seul navigate préserve les sélections partielles de l'arbre
   * marque→gammes (un replay de toggles par marque les élargirait en marque
   * entière) et évite les rafales de navigations.
   */
  captureFilters: () => FilterState
  onRestoreFilters: (snapshot: FilterState) => void

  /** Comptes optionnels affichés à droite des options. */
  productCounts?: {
    brands?: Record<string, number>
    tags?: Record<string, Record<string, number>>
  }
}

type SortKey = 'bestsellers' | 'az' | 'za' | 'priceAsc' | 'priceDesc'

const SORT_OPTIONS: Array<{ value: string; key: SortKey }> = [
  { value: 'bestsellers', key: 'bestsellers' },
  { value: 'az', key: 'az' },
  { value: 'za', key: 'za' },
  { value: 'price-asc', key: 'priceAsc' },
  { value: 'price-desc', key: 'priceDesc' },
]

/**
 * Bottom sheet mobile pour les filtres catalogue. S'appuie sur
 * <dialog> natif — focus trap, Esc, ::backdrop, scroll lock gratuits.
 */
export function FiltersMobileSheet({
  open,
  onClose,
  matchedCount,
  availableBrands,
  itemsByType,
  sort,
  selectedBrands,
  selectedTags,
  onSortChange,
  onBrandToggle,
  onTagToggle,
  onClearAll,
  captureFilters,
  onRestoreFilters,
  productCounts,
}: Props) {
  const t = useTranslations('MobileFilters')
  const tSort = useTranslations('Filters.sortOptions')
  const tTagTypes = useTranslations('Filters.tagTypes')
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  // Snapshot des sélections à l'ouverture pour pouvoir restaurer au Cancel
  const [snapshot, setSnapshot] = useState<FilterState | null>(null)

  // Synchronise l'état open ↔ <dialog>
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.style.transform = '' // reset tout résidu de drag-to-dismiss
      setSnapshot(captureFilters())
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Cible de défilement après fermeture : null = restaurer la position d'avant
  // l'ouverture (dismiss/coup d'œil) ; 0 = HAUT de page (après « Appliquer » →
  // on veut voir les résultats filtrés depuis le début).
  const scrollTargetRef = useRef<number | null>(null)

  // Verrou de défilement du body pendant l'ouverture : sinon iOS Safari laisse la
  // page catalogue défiler DERRIÈRE le sheet (le modal natif ne suffit pas).
  // Astuce position:fixed → fige la page + restaure la position au close.
  useEffect(() => {
    if (!open) return
    const body = document.body
    const scrollY = window.scrollY
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.width = prev.width
      body.style.overflow = prev.overflow
      const target = scrollTargetRef.current ?? scrollY
      scrollTargetRef.current = null
      // `behavior:'instant'` par robustesse : un saut sec (ou rester en haut
      // après Appliquer), jamais d'animation — même si un `scroll-behavior:smooth`
      // global réapparaissait un jour (retiré de globals.css le 2026-06-18).
      window.scrollTo({ top: target, left: 0, behavior: 'instant' as ScrollBehavior })
    }
  }, [open])

  // Restaure le snapshot sur Esc (annulation explicite clavier — desktop)
  const revertToSnapshot = () => {
    if (snapshot) onRestoreFilters(snapshot)
  }
  const handleCancel = () => {
    revertToSnapshot()
    onClose()
  }
  const handleApply = () => {
    // Les filtres sont déjà appliqués live → on ferme. « Appliquer » = nouvelle
    // recherche : on revient en HAUT des résultats filtrés (instantané, via
    // scrollTargetRef lu par le verrou de scroll au démontage).
    scrollTargetRef.current = 0
    onClose()
  }
  // Dismiss (tap hors feuille / swipe vers le bas) : on FERME en gardant les
  // filtres déjà appliqués live (un revert surprendrait — la grille reflète déjà
  // le choix de l'utilisateur).
  const handleDismiss = () => {
    onClose()
  }
  const handleNativeClose = () => {
    if (open) onClose()
  }

  // Tap sur le ::backdrop (au-dessus de la feuille) → fermer.
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const d = dialogRef.current
    if (!d || e.target !== d) return // un enfant = clic à l'intérieur de la feuille
    const r = d.getBoundingClientRect()
    if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) {
      handleDismiss()
    }
  }

  // Swipe vers le bas sur la poignée/header → fermer (drag-to-dismiss).
  const dragStartY = useRef<number | null>(null)
  const dragDelta = useRef(0)
  const onGrabStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0]?.clientY ?? null
    dragDelta.current = 0
  }
  const onGrabMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return
    const dy = (e.touches[0]?.clientY ?? 0) - dragStartY.current
    dragDelta.current = dy
    const d = dialogRef.current
    if (d && dy > 0) d.style.transform = `translateY(${dy}px)`
  }
  const onGrabEnd = () => {
    const shouldClose = dragDelta.current > 80
    const d = dialogRef.current
    if (d && !shouldClose) d.style.transform = '' // snap back (le close reset au prochain open)
    dragStartY.current = null
    dragDelta.current = 0
    if (shouldClose) handleDismiss()
  }

  return (
    <dialog
      ref={dialogRef}
      className="farmau-sheet w-full"
      onClose={handleNativeClose}
      onClick={handleBackdropClick}
      onCancel={(e) => {
        // Esc → revert ET ne pas double-close
        e.preventDefault()
        handleCancel()
      }}
      aria-labelledby="filters-sheet-title"
    >
      {/* Zone d'empoignade (poignée + header) : drag vers le bas = fermer. */}
      <div
        className="shrink-0"
        style={{ touchAction: 'none' }}
        onTouchStart={onGrabStart}
        onTouchMove={onGrabMove}
        onTouchEnd={onGrabEnd}
      >
        {/* Handle — wider, more visible */}
        <div className="flex justify-center py-2.5">
          <span
            aria-hidden
            className="w-12 h-[5px] rounded-full bg-sand-400 opacity-70"
          />
        </div>

        {/* Header — eyebrow count + title with active count */}
        <header className="px-[22px] pb-4 flex justify-between items-start gap-3">
        <div>
          <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium mb-0.5">
            {t('productCount', { count: matchedCount })}
          </span>
          <h2
            id="filters-sheet-title"
            className="font-serif text-[24px] text-ink-900 m-0 flex items-baseline gap-1.5"
          >
            {t('sheetTitle')}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[12px] text-ink-700 hover:text-brick-600 underline underline-offset-[3px] bg-transparent border-0 px-1 py-1 transition-colors mt-1"
        >
          {t('clearAll')}
        </button>
        </header>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {/* Ordenar — radio */}
        <FilterSection
          id="sort"
          title={t('sortLabel')}
          defaultOpen
        >
          <div className="flex flex-col gap-1">
            {SORT_OPTIONS.map((opt) => {
              const active = sort === opt.value
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 py-2 text-[13.5px] text-ink-800 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="sort"
                    value={opt.value}
                    checked={active}
                    onChange={() => onSortChange(opt.value)}
                    className="sr-only"
                  />
                  <span
                    className={`relative w-[18px] h-[18px] rounded-full border-2 shrink-0 ${
                      active
                        ? 'border-clay-700 after:content-[""] after:absolute after:inset-[3px] after:rounded-full after:bg-clay-700'
                        : 'border-sand-500 bg-sand-50'
                    }`}
                  />
                  <span className="capitalize">{titleCase(tSort(opt.key))}</span>
                </label>
              )
            })}
          </div>
        </FilterSection>

        {/* Marcas — checkbox */}
        {availableBrands.length > 0 && (
          <FilterSection
            id="brands"
            title={t('brandsLabel')}
            badgeCount={selectedBrands.size}
            defaultOpen
          >
            <div className="flex flex-col gap-0.5">
              {availableBrands.map((brand) => {
                const checked = selectedBrands.has(brand)
                const count = productCounts?.brands?.[brand]
                return (
                  <label
                    key={brand}
                    className="flex items-center gap-2.5 py-1.5 text-[13.5px] text-ink-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onBrandToggle(brand)}
                      className="sr-only"
                    />
                    <span
                      className={`w-[18px] h-[18px] rounded-[4px] shrink-0 inline-flex items-center justify-center text-[11px] font-semibold transition-colors ${
                        checked
                          ? 'bg-ink-900 border-2 border-ink-900 text-sand-50'
                          : 'bg-sand-50 border-2 border-sand-500 text-transparent'
                      }`}
                    >
                      {checked ? '✓' : ''}
                    </span>
                    <span className="flex-1 flex items-baseline gap-1.5">
                      {brand}
                      {count !== undefined && (
                        <small className="text-[11.5px] text-ink-500">({count})</small>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          </FilterSection>
        )}

        {/* Tag types (categories, besoins, types-peau, ingredients) — chips */}
        {Object.entries(itemsByType).map(([tagTypeSlug, items]) => {
          if (items.length === 0) return null
          const key = TAG_TYPE_TRANSLATION[tagTypeSlug] ?? 'besoins'
          const label = tTagTypes(key)
          const selected = selectedTags[tagTypeSlug] ?? new Set<string>()
          return (
            <FilterSection
              key={tagTypeSlug}
              id={tagTypeSlug}
              title={titleCase(label)}
              badgeCount={selected.size}
              defaultOpen={selected.size > 0 || tagTypeSlug === 'besoins'}
            >
              <div className="flex flex-wrap gap-1.5 py-1">
                {items.map((item) => {
                  const on = selected.has(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onTagToggle(tagTypeSlug, item)}
                      aria-pressed={on}
                      className={`px-3 py-[7px] rounded-[10px] text-[12.5px] leading-[1.3] border transition-colors inline-flex items-center gap-1 ${
                        on
                          ? 'bg-clay-700 text-on-accent border-clay-700'
                          : 'bg-sand-50 text-ink-700 border-sand-300 hover:border-ink-700'
                      }`}
                    >
                      {item}{on && ' ✓'}
                    </button>
                  )
                })}
              </div>
            </FilterSection>
          )
        })}
      </div>

      {/* Footer — single CTA with scroll-fade + safe-area (home-indicator ET
          barre Safari basse, sinon le CTA Appliquer passe derrière elle). */}
      <footer
        className="px-[22px] pt-3 bg-sand-50 relative"
        style={{ paddingBottom: 'max(18px, env(safe-area-inset-bottom, 18px), var(--browser-bottom-inset, 0px))' }}
      >
        <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-b from-transparent to-sand-50 pointer-events-none" />
        <button
          type="button"
          onClick={handleApply}
          disabled={matchedCount === 0}
          className="w-full h-[50px] rounded-xl bg-clay-700 text-on-accent text-[14.5px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {t('applyButton')} · {t('applyCount', { count: matchedCount })}
        </button>
      </footer>
    </dialog>
  )
}

type SectionProps = {
  id: string
  title: string
  children: React.ReactNode
  badgeCount?: number
  defaultOpen?: boolean
}

function FilterSection({ id, title, children, badgeCount = 0, defaultOpen = false }: SectionProps) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-sand-200 [&[open]>summary>.fs-chev]:rotate-180"
      data-section={id}
    >
      <summary className="list-none px-5 py-3.5 flex justify-between items-center cursor-pointer text-[13px] font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-baseline gap-2">
          {title}
          {badgeCount > 0 && (
            <span className="text-[11px] text-clay-700 font-semibold bg-clay-50 border border-clay-200 rounded-full px-1.5 py-px">
              {badgeCount}
            </span>
          )}
        </span>
        <span className="fs-chev text-ink-500 text-[10px] transition-transform">▾</span>
      </summary>
      <div className="px-5 pb-3.5">{children}</div>
    </details>
  )
}

function titleCase(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
