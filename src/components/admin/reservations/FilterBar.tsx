'use client'

import { Search } from 'lucide-react'
import type { StatusFilter, DbReservationStatus } from './types'

const TAB_ORDER: StatusFilter[] = [
  'all',
  'pending',
  'confirmed',
  'collected',
  'cancelled',
  'expired',
]

const TAB_LABEL: Record<StatusFilter, string> = {
  all: 'Todas',
  pending: 'Reservadas',
  confirmed: 'Confirmadas',
  collected: 'Entregadas',
  expired: 'Expiradas',
  cancelled: 'Canceladas',
}

export type SortOption = 'newest' | 'oldest' | 'total-desc' | 'total-asc'

type FilterBarProps = {
  search: string
  onSearchChange: (value: string) => void

  filter: StatusFilter
  onFilterChange: (filter: StatusFilter) => void
  counts: Record<string, number>

  sort: SortOption
  onSortChange: (sort: SortOption) => void
}

export function FilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  counts,
  sort,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="bg-sand-100 border-b border-sand-300 px-5 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 sticky top-[88px] z-[4]">
      <label className="flex items-center gap-2 bg-sand-50 border border-sand-300 rounded-md px-3 py-1.5 text-ink-700 min-w-0 flex-1 max-w-md">
        <Search className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por referencia, cliente, teléfono…"
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[13.5px] text-ink-900 placeholder:text-ink-500"
          aria-label="Buscar reservas"
        />
      </label>

      <div className="flex gap-1.5 items-center flex-wrap">
        {TAB_ORDER.map((tab) => {
          const active = filter === tab
          const count = countFor(tab, counts)
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onFilterChange(tab)}
              className={`px-3 py-1.5 text-[12.5px] rounded-full border inline-flex items-center gap-1.5 transition-colors ${
                active
                  ? 'bg-ink-900 text-sand-50 border-ink-900 font-medium'
                  : 'bg-sand-50 text-ink-700 border-sand-300 hover:border-sand-500 hover:text-ink-900'
              }`}
            >
              {TAB_LABEL[tab]}
              <span
                className={`font-mono text-[10.5px] ${
                  active ? 'opacity-85' : 'opacity-70'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 lg:ml-auto text-[12.5px] text-ink-700">
        <span>Ordenar por</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="appearance-none bg-sand-50 border border-sand-300 text-ink-900 text-[12.5px] rounded-md px-2.5 py-1.5 pr-7 cursor-pointer"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235A5448' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
          }}
        >
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguas</option>
          <option value="total-desc">Total descendente</option>
          <option value="total-asc">Total ascendente</option>
        </select>
      </div>
    </div>
  )
}

function countFor(tab: StatusFilter, counts: Record<string, number>): number {
  if (tab === 'all') {
    return Object.entries(counts).reduce(
      (acc, [key, value]) => (key === 'all' ? acc : acc + value),
      0,
    ) || counts.all || 0
  }
  return counts[tab as DbReservationStatus] ?? 0
}
