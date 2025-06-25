'use client'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const FILTER_SECTIONS = [
  { key: 'brands',     title: 'MARQUES',     tagType: 'brand' },
  { key: 'types',      title: 'TYPES',       tagType: 'category' },
  { key: 'needs',      title: 'BESOINS',     tagType: 'need' },
  { key: 'ranges',     title: 'GAMMES',      tagType: 'range' },
  { key: 'ingredients',title: 'INGRÉDIENTS', tagType: 'ingredient' }
]

type Props = {
  itemsByType: Record<string,string[]>
  onChange: (selected: Record<string,string[]>) => void
}

export default function Filters({ itemsByType, onChange }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<Record<string,string[]>>({})

  const toggleSection = (key: string) =>
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))

  const toggleItem = (tagType: string, item: string) => {
    setSelected(prev => {
      const list = prev[tagType] ?? []
      const next = list.includes(item)
        ? list.filter(i => i !== item)
        : [...list, item]
      return { ...prev, [tagType]: next }
    })
  }

  // Notify parent on selection change
  useEffect(() => onChange(selected), [selected, onChange])

  return (
    <aside className="w-60 shrink-0 mt-4 space-y-8">
      {FILTER_SECTIONS.map(({ key, title, tagType }) => (
        <div key={key}>
          <button
            type="button"
            onClick={() => toggleSection(key)}
            className="flex justify-between items-center w-full"
          >
            <h3 className="font-semibold">{title}</h3>
            {open[key] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {open[key] && (
            <ul className="mt-2 space-y-1">
              {(itemsByType[tagType] ?? []).map(item => (
                <li key={item}>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selected[tagType]?.includes(item) || false}
                      onChange={() => toggleItem(tagType, item)}
                      className="mr-2"
                    />
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </aside>
  )
}
