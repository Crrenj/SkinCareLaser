'use client'
import { useState } from 'react'

const OPTIONS = [
  { value: 'az',       label: 'Alphabétique A→Z' },
  { value: 'za',       label: 'Alphabétique Z→A' },
  { value: 'price-asc',  label: 'Prix ↑' },
  { value: 'price-desc', label: 'Prix ↓' },
  { value: 'trending', label: 'Tendance' }
]

export default function SortSelector() {
  const [sort, setSort] = useState('az')

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value)
    // TODO: déclencher le fetch/tri côté client ou envoyer événement
  }

  return (
    <div className="mb-4">
      <label className="mr-2 font-medium">Trier :</label>
      <select
        value={sort}
        onChange={handleChange}
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
