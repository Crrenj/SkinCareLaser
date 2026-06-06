'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

type TagTypeKey = 'categories' | 'besoins' | 'typesPeau' | 'ingredients'

const TAG_TYPE_TRANSLATION: Record<string, TagTypeKey> = {
  categories: 'categories',
  besoins: 'besoins',
  'types-peau': 'typesPeau',
  ingredients: 'ingredients',
}

type FiltersSnapshot = {
  sort: string
  brands: Set<string>
  tags: Record<string, Set<string>>
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
  productCounts,
}: Props) {
  const t = useTranslations('MobileFilters')
  const tSort = useTranslations('Filters.sortOptions')
  const tTagTypes = useTranslations('Filters.tagTypes')
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  // Snapshot des sélections à l'ouverture pour pouvoir restaurer au Cancel
  const [snapshot, setSnapshot] = useState<FiltersSnapshot | null>(null)

  // Synchronise l'état open ↔ <dialog>
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setSnapshot({
        sort,
        brands: new Set(selectedBrands),
        tags: Object.fromEntries(
          Object.entries(selectedTags).map(([k, v]) => [k, new Set(v)]),
        ),
      })
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Restaure le snapshot quand l'utilisateur fait Cancel ou ferme via Esc / clic backdrop
  const revertToSnapshot = () => {
    if (!snapshot) return
    if (snapshot.sort !== sort) onSortChange(snapshot.sort)
    // Revert brands
    const targetBrands = snapshot.brands
    selectedBrands.forEach((b) => {
      if (!targetBrands.has(b)) onBrandToggle(b)
    })
    targetBrands.forEach((b) => {
      if (!selectedBrands.has(b)) onBrandToggle(b)
    })
    // Revert tags
    for (const tagType of Object.keys({ ...selectedTags, ...snapshot.tags })) {
      const current = selectedTags[tagType] ?? new Set<string>()
      const previous = snapshot.tags[tagType] ?? new Set<string>()
      current.forEach((name) => {
        if (!previous.has(name)) onTagToggle(tagType, name)
      })
      previous.forEach((name) => {
        if (!current.has(name)) onTagToggle(tagType, name)
      })
    }
  }

  const handleCancel = () => {
    revertToSnapshot()
    onClose()
  }
  const handleApply = () => {
    // Les filtres sont déjà appliqués live ; il suffit de fermer
    onClose()
  }
  // Ferme sur ::backdrop / Esc — événement natif du <dialog>
  const handleNativeClose = () => {
    if (open) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="farmau-sheet w-full"
      onClose={handleNativeClose}
      onCancel={(e) => {
        // Esc → revert ET ne pas double-close
        e.preventDefault()
        handleCancel()
      }}
      aria-labelledby="filters-sheet-title"
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

      <div className="flex-1 overflow-y-auto">
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

      {/* Footer — single CTA with scroll-fade + safe-area */}
      <footer className="px-[22px] pt-3 pb-[max(18px,env(safe-area-inset-bottom,18px))] bg-sand-50 relative">
        <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-b from-transparent to-sand-50 pointer-events-none" />
        <button
          type="button"
          onClick={handleApply}
          disabled={matchedCount === 0}
          className="w-full h-[50px] rounded-xl bg-clay-700 text-on-accent text-[14.5px] font-medium hover:bg-clay-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
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
