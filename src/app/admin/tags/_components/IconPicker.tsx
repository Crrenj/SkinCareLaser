'use client'

import { iconOptions } from '../_lib/icons'

type IconPickerProps = {
  value: string
  onChange: (value: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
      {iconOptions.map((option) => {
        const selected = value === option.value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={`p-3 rounded-lg border-2 transition-all ${
              selected
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            title={option.label}
          >
            <Icon className="h-5 w-5 mx-auto text-gray-700" />
          </button>
        )
      })}
    </div>
  )
}
