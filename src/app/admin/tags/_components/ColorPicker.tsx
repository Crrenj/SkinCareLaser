'use client'

import { colorOptions } from '../_lib/icons'

type ColorPickerProps = {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {colorOptions.map((color) => {
        const selected = value === color
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-pressed={selected}
            aria-label={`Choisir la couleur ${color}`}
            className={`w-full h-10 rounded-lg border-2 transition-all ${
              selected
                ? 'border-ink-900 scale-110'
                : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
          />
        )
      })}
    </div>
  )
}
