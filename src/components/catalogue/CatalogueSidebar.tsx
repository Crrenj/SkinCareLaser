'use client'

import { useTranslations } from 'next-intl'

type Counts = {
  brands?: Record<string, number>
  ranges?: Record<string, number>
  tags?: Record<string, Record<string, number>>
}

type Props = {
  availableBrands: string[]
  rangesByBrand: Record<string, string[]>
  itemsByType: Record<string, string[]>
  selectedBrands: Set<string>
  selectedRanges: Set<string>
  selectedTags: Record<string, Set<string>>
  onBrandToggle: (brand: string) => void
  onRangeToggle: (range: string) => void
  onBrandSelectAll: (brand: string, select: boolean) => void
  onTagToggle: (tagType: string, tagName: string) => void
  productCounts?: Counts
}

const TAG_TYPE_KEY: Record<string, 'categories' | 'besoins' | 'typesPeau' | 'ingredients'> = {
  categories: 'categories',
  besoins: 'besoins',
  'types-peau': 'typesPeau',
  ingredients: 'ingredients',
}

/** Rendu en chips toggle plutôt qu'en checkboxes pour ces tag types. */
const CHIP_TAG_TYPES = new Set<string>(['types-peau', 'ingredients'])

export function CatalogueSidebar({
  availableBrands,
  rangesByBrand,
  itemsByType,
  selectedBrands,
  selectedRanges,
  selectedTags,
  onBrandToggle,
  onRangeToggle,
  onBrandSelectAll,
  onTagToggle,
  productCounts,
}: Props) {
  const tFilters = useTranslations('Filters')
  const tTagTypes = useTranslations('Filters.tagTypes')

  const tagTypeLabel = (slug: string) => {
    const key = TAG_TYPE_KEY[slug]
    return key ? tTagTypes(key) : slug.replace(/-/g, ' ')
  }

  return (
    <aside
      aria-label={tFilters('filterHeading')}
      className="lg:sticky lg:top-[168px] lg:self-start lg:max-h-[calc(100vh-188px)] lg:overflow-y-auto lg:pr-2.5 scrollbar-thin"
    >
      {availableBrands.length > 0 && (
        <Block
          heading={tFilters('brands')}
          count={availableBrands.length.toString()}
        >
          {availableBrands.map((brand) => {
            const brandRanges = rangesByBrand[brand] ?? []
            const someRangesSelected =
              brandRanges.length > 0 &&
              brandRanges.some((r) => selectedRanges.has(r))
            const allRangesSelected =
              brandRanges.length > 0 &&
              brandRanges.every((r) => selectedRanges.has(r))
            const checked = selectedBrands.has(brand) || allRangesSelected

            return (
              <div key={brand}>
                <CheckboxRow
                  label={brand}
                  checked={checked}
                  indeterminate={!checked && someRangesSelected}
                  count={productCounts?.brands?.[brand]}
                  onChange={() => {
                    if (checked) {
                      if (selectedBrands.has(brand)) onBrandToggle(brand)
                      if (allRangesSelected) onBrandSelectAll(brand, false)
                    } else {
                      onBrandToggle(brand)
                      onBrandSelectAll(brand, true)
                    }
                  }}
                />
                {brandRanges.length > 0 && checked && (
                  <div className="ml-1.5 border-l border-dashed border-sand-300 pl-4">
                    {brandRanges.map((range) => (
                      <CheckboxRow
                        key={range}
                        label={range}
                        checked={selectedRanges.has(range)}
                        count={productCounts?.ranges?.[range]}
                        onChange={() => onRangeToggle(range)}
                        compact
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </Block>
      )}

      {Object.entries(itemsByType).map(([tagType, tagNames]) => {
        if (tagNames.length === 0) return null
        const selectedSet = selectedTags[tagType] ?? new Set<string>()
        const useChips = CHIP_TAG_TYPES.has(tagType)
        const counts = productCounts?.tags?.[tagType] ?? {}

        return (
          <Block key={tagType} heading={tagTypeLabel(tagType)}>
            {useChips ? (
              <div className="flex flex-wrap gap-1.5">
                {tagNames.map((name) => {
                  const on = selectedSet.has(name)
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onTagToggle(tagType, name)}
                      className={`text-[12.5px] py-1.5 px-3 rounded-full border transition-colors ${
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
            ) : (
              tagNames.map((name) => (
                <CheckboxRow
                  key={name}
                  label={name}
                  checked={selectedSet.has(name)}
                  count={counts[name]}
                  onChange={() => onTagToggle(tagType, name)}
                />
              ))
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
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-700 mb-3.5 flex justify-between items-center">
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

function CheckboxRow({
  label,
  checked,
  indeterminate = false,
  count,
  onChange,
  compact = false,
}: {
  label: string
  checked: boolean
  indeterminate?: boolean
  count?: number
  onChange: () => void
  compact?: boolean
}) {
  return (
    <label
      className={`flex items-center gap-2.5 py-1 cursor-pointer transition-colors ${
        compact ? 'text-[13.5px] text-ink-700' : 'text-[14px] text-ink-800'
      } ${checked ? 'text-ink-900 font-medium' : 'hover:text-clay-700'}`}
    >
      <input
        type="checkbox"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate
        }}
        onChange={onChange}
        className="w-3.5 h-3.5 cursor-pointer accent-clay-700"
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="font-mono text-[12px] text-ink-500">{count}</span>
      )}
    </label>
  )
}
