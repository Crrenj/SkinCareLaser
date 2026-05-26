'use client'

import { X } from 'lucide-react'

type PopCloseProps = {
  onClick: () => void
  label?: string
  className?: string
}

export function PopClose({ onClick, label = 'Cerrar', className = '' }: PopCloseProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`w-9 h-9 inline-flex items-center justify-center rounded-[10px] border-0 bg-transparent text-ink-700 cursor-pointer shrink-0 transition-colors hover:bg-sand-200 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700/40 focus-visible:ring-offset-2 ${className}`}
    >
      <X className="w-[18px] h-[18px]" strokeWidth={1.4} />
    </button>
  )
}
