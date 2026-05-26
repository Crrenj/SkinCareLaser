'use client'

type ScrimProps = {
  visible: boolean
  onClick: () => void
  className?: string
}

export function Scrim({ visible, onClick, className = '' }: ScrimProps) {
  return (
    <div
      className={`fixed inset-0 z-40 bg-[--pop-backdrop] backdrop-blur-[14px] backdrop-saturate-[120%] transition-opacity duration-200 ${
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      } ${className}`}
      onClick={onClick}
      aria-hidden
    />
  )
}
