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
    <div className="flex items-center space-x-3">
      <label className="text-sm font-medium text-gray-700">Trier par :</label>
      <select
        value={sort}
        onChange={handle}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
