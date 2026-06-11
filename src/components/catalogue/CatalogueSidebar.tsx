'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { BrandTreeModel } from '@/lib/catalogueFilters'

type Counts = {
  brands?: Record<string, number>
  ranges?: Record<string, number>
  tags?: Record<string, Record<string, number>>
}

type Props = {
  availableBrands: string[]
  rangesByBrand: Record<string, string[]>
  itemsByType: Record<string, string[]>
  /** Sélection de l'arbre : par marque, 'full' ou sous-ensemble de gammes. */
  treeModel: BrandTreeModel
  selectedTags: Record<string, Set<string>>
  onBrandToggle: (brand: string) => void
  onRangeToggle: (brand: string, range: string) => void
  onTagToggle: (tagType: string, tagName: string) => void
  productCounts?: Counts
}

const TAG_TYPE_KEY: Record<string, 'categories' | 'besoins' | 'typesPeau' | 'ingredients'> = {
  categories: 'categories',
  besoins: 'besoins',
  'types-peau': 'typesPeau',
  ingredients: 'ingredients',
}

/** Ordre d'affichage des blocs (design Rail editorial) ; le reste suit. */
const TAG_TYPE_ORDER = ['besoins', 'types-peau', 'ingredients', 'categories']

/** Rendu en chips toggle plutôt qu'en checkboxes pour ces tag types. */
const CHIP_TAG_TYPES = new Set<string>(['types-peau', 'ingredients'])

const BRANDS_COLLAPSED_LIMIT = 8
const CHECKLIST_COLLAPSED_LIMIT = 6
const CHIPS_COLLAPSED_LIMIT = 8

export function CatalogueSidebar({
  availableBrands,
  rangesByBrand,
  itemsByType,
  treeModel,
  selectedTags,
  onBrandToggle,
  onRangeToggle,
  onTagToggle,
  productCounts,
}: Props) {
  const tFilters = useTranslations('Filters')
  const tTagTypes = useTranslations('Filters.tagTypes')

  // Marques dépliées (chevron). Les marques avec sélection partielle au
  // chargement sont ouvertes d'office — on montre POURQUOI elles sont en
  // état indéterminé.
  const [openBrands, setOpenBrands] = useState<Set<string>>(
    () => new Set(Object.keys(treeModel).filter((b) => treeModel[b] !== 'full')),
  )
  const [showAllBrands, setShowAllBrands] = useState(false)

  const toggleOpen = (brand: string) =>
    setOpenBrands((prev) => {
      const next = new Set(prev)
      if (next.has(brand)) next.delete(brand)
      else next.add(brand)
      return next
    })

  const tagTypeLabel = (slug: string) => {
    const key = TAG_TYPE_KEY[slug]
    return key ? tTagTypes(key) : slug.replace(/-/g, ' ')
  }

  // Repliée, la liste garde visibles les marques sélectionnées au-delà de
  // la limite (une sélection ne doit jamais être cachée).
  const visibleBrands = showAllBrands
    ? availableBrands
    : availableBrands.filter(
        (b, i) => i < BRANDS_COLLAPSED_LIMIT || b in treeModel,
      )

  const orderedTagTypes = Object.entries(itemsByType).sort(([a], [b]) => {
    const ia = TAG_TYPE_ORDER.indexOf(a)
    const ib = TAG_TYPE_ORDER.indexOf(b)
    return (ia === -1 ? TAG_TYPE_ORDER.length : ia) - (ib === -1 ? TAG_TYPE_ORDER.length : ib)
  })

  return (
    <aside
      aria-label={tFilters('filterHeading')}
      className="lg:sticky lg:top-[76px] lg:self-start lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto lg:pr-2.5"
    >
      {availableBrands.length > 0 && (
        <Block
          heading={tFilters('brandsRanges')}
          count={availableBrands.length.toString()}
        >
          {visibleBrands.map((brand) => {
            const brandRanges = rangesByBrand[brand] ?? []
            const entry = treeModel[brand]
            const checked = entry === 'full'
            const partial = Array.isArray(entry)
            const open = openBrands.has(brand)
            const brandCount = productCounts?.brands?.[brand]

            return (
              <div key={brand}>
                <div
                  className={`flex items-center gap-2 py-[5px] text-[14px] transition-colors ${
                    checked || partial ? 'text-ink-900 font-medium' : 'text-ink-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleOpen(brand)}
                    aria-expanded={open}
                    aria-label={tFilters('treeToggleAriaLabel', { brand })}
                    className={`w-[18px] h-[18px] shrink-0 flex items-center justify-center rounded-[3px] text-ink-500 hover:bg-sand-200 hover:text-ink-800 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700 ${
                      open ? 'rotate-90' : ''
                    }`}
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 12 12"
                      className="w-[11px] h-[11px] fill-none stroke-current stroke-[2.2]"
                    >
                      <path d="M3.5 1.5 8 6l-4.5 4.5" />
                    </svg>
                  </button>
                  <input
                    type="checkbox"
                    checked={checked}
                    ref={(el) => {
                      if (el) el.indeterminate = partial
                    }}
                    onChange={() => onBrandToggle(brand)}
                    aria-label={brandCount !== undefined ? `${brand} (${brandCount})` : brand}
                    className="w-3.5 h-3.5 shrink-0 cursor-pointer accent-clay-700"
                  />
                  <button
                    type="button"
                    onClick={() => toggleOpen(brand)}
                    className="flex-1 text-left cursor-pointer rounded-[2px] hover:text-clay-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700"
                  >
                    {brand}
                  </button>
                  <span aria-hidden className="font-mono text-[11.5px] text-ink-500">
                    {brandCount}
                  </span>
                </div>

                {open && brandRanges.length > 0 && (
                  <div className="ml-[13px] border-l border-dashed border-sand-300 pl-3.5">
                    {brandRanges.map((range) => {
                      const rangeChecked =
                        checked || (partial && entry.includes(range))
                      return (
                        <label
                          key={range}
                          className={`flex items-center gap-2.5 py-1 text-[13px] cursor-pointer transition-colors ${
                            rangeChecked
                              ? 'text-ink-900 font-medium'
                              : 'text-ink-700 hover:text-clay-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={rangeChecked}
                            onChange={() => onRangeToggle(brand, range)}
                            className="w-3.5 h-3.5 shrink-0 cursor-pointer accent-clay-700"
                          />
                          <span className="flex-1">{range}</span>
                          <span className="font-mono text-[11px] text-ink-500">
                            {productCounts?.ranges?.[range]}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {availableBrands.length > BRANDS_COLLAPSED_LIMIT && (
            <SeeAllButton
              expanded={showAllBrands}
              onClick={() => setShowAllBrands((v) => !v)}
              moreLabel={tFilters('showAllBrands', { count: availableBrands.length })}
              lessLabel={tFilters('showLess')}
            />
          )}
        </Block>
      )}

      {orderedTagTypes.map(([tagType, tagNames]) => {
        if (tagNames.length === 0) return null
        const selectedSet = selectedTags[tagType] ?? new Set<string>()
        const useChips = CHIP_TAG_TYPES.has(tagType)
        const counts = productCounts?.tags?.[tagType] ?? {}

        return (
          <Block key={tagType} heading={tagTypeLabel(tagType)}>
            {useChips ? (
              <ChipList
                items={tagNames}
                selected={selectedSet}
                limit={CHIPS_COLLAPSED_LIMIT}
                onToggle={(name) => onTagToggle(tagType, name)}
                moreLabel={(n) => tFilters('showMore', { count: n })}
                lessLabel={tFilters('showLess')}
              />
            ) : (
              <CheckList
                items={tagNames}
                selected={selectedSet}
                counts={counts}
                limit={CHECKLIST_COLLAPSED_LIMIT}
                onToggle={(name) => onTagToggle(tagType, name)}
                moreLabel={(n) => tFilters('showMore', { count: n })}
                lessLabel={tFilters('showLess')}
              />
            )}
          </Block>
        )
      })}
    </aside>
  )
}

function Block({
  heading,
  count,
  children,
}: {
  heading: string
  count?: string
  children: React.ReactNode
}) {
  return (
    <section className="py-5.5 border-b border-sand-300 first:pt-0 last:border-b-0">
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-700 mb-3 flex justify-between items-center">
        <span>{heading}</span>
        {count && (
          <small className="font-sans normal-case tracking-normal text-ink-500 text-[12px]">
            {count}
          </small>
        )}
      </div>
      {children}
    </section>
  )
}

function SeeAllButton({
  expanded,
  onClick,
  moreLabel,
  lessLabel,
}: {
  expanded: boolean
  onClick: () => void
  moreLabel: string
  lessLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 font-mono text-[11px] tracking-[0.06em] text-clay-700 hover:text-clay-800 transition-colors focus-visible:outline-none focus-visible:underline"
    >
      {expanded ? `− ${lessLabel}` : `+ ${moreLabel}`}
    </button>
  )
}

function CheckList({
  items,
  selected,
  counts,
  limit,
  onToggle,
  moreLabel,
  lessLabel,
}: {
  items: string[]
  selected: Set<string>
  counts: Record<string, number>
  limit: number
  onToggle: (name: string) => void
  moreLabel: (hidden: number) => string
  lessLabel: string
}) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll
    ? items
    : items.filter((name, i) => i < limit || selected.has(name))

  return (
    <div>
      {visible.map((name) => {
        const checked = selected.has(name)
        return (
          <label
            key={name}
            className={`flex items-center gap-2.5 py-1 text-[13.5px] cursor-pointer transition-colors ${
              checked ? 'text-ink-900 font-medium' : 'text-ink-800 hover:text-clay-700'
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(name)}
              className="w-3.5 h-3.5 cursor-pointer accent-clay-700"
            />
            <span className="flex-1">{name}</span>
            {counts[name] !== undefined && (
              <span className="font-mono text-[11.5px] text-ink-500">{counts[name]}</span>
            )}
          </label>
        )
      })}
      {items.length > limit && (
        <SeeAllButton
          expanded={showAll}
          onClick={() => setShowAll((v) => !v)}
          moreLabel={moreLabel(items.length - limit)}
          lessLabel={lessLabel}
        />
      )}
    </div>
  )
}

function ChipList({
  items,
  selected,
  limit,
  onToggle,
  moreLabel,
  lessLabel,
}: {
  items: string[]
  selected: Set<string>
  limit: number
  onToggle: (name: string) => void
  moreLabel: (hidden: number) => string
  lessLabel: string
}) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll
    ? items
    : items.filter((name, i) => i < limit || selected.has(name))

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((name) => {
          const on = selected.has(name)
          return (
            <button
              key={name}
              type="button"
              onClick={() => onToggle(name)}
              aria-pressed={on}
              className={`text-[12.5px] py-1.5 px-3 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700 ${
                on
                  ? 'bg-ink-900 text-sand-50 border-ink-900'
                  : 'bg-sand-50 text-ink-700 border-sand-400 hover:border-ink-900 hover:text-ink-900'
              }`}
            >
              {name}
            </button>
          )
        })}
      </div>
      {items.length > limit && (
        <SeeAllButton
          expanded={showAll}
          onClick={() => setShowAll((v) => !v)}
          moreLabel={moreLabel(items.length - limit)}
          lessLabel={lessLabel}
        />
      )}
    </div>
  )
}
