'use client'
import { ChangeEvent } from 'react'

const OPTIONS = [
  { value: 'az',        label: 'Alphabétique A→Z' },
  { value: 'za',        label: 'Alphabétique Z→A' },
  { value: 'price-asc', label: 'Prix ↑' },
  { value: 'price-desc',label: 'Prix ↓' },
  { value: 'trending',  label: 'Tendance' }
]

type Props = {
  sort: string
  onChange: (value: string) => void
}

export default function SortSelector({ sort, onChange }: Props) {
  const handle = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="mb-4">
      <label className="mr-2 font-medium">Trier :</label>
      <select
        value={sort}
        onChange={handle}
        className="border rounded px-2 py-1"
      >
        {OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
