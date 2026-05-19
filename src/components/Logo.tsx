'use client'

import { Link } from '@/i18n/navigation'

interface LogoProps {
  /** Diamètre du cercle en px. Défaut 64. */
  size?: number
  /** Si fourni, le logo n'est pas un Link mais déclenche ce handler (utile dans le drawer). */
  onClick?: () => void
  className?: string
}

/**
 * Logo FARMAU : cercle sand-50 avec bord clay-600,
 * glyph « F » en Instrument Serif italic + wordmark « FARMAU » dessous.
 * Tient en 48 / 64 / 96 px selon le contexte.
 */
export default function Logo({ size = 64, onClick, className = '' }: LogoProps) {
  const glyphSize = Math.round(size * 0.41)
  const wmSize = Math.max(6, Math.round(size * 0.11))

  const inner = (
    <span
      style={{ width: size, height: size }}
      className={`relative flex flex-col items-center justify-center bg-sand-50 border-[1.5px] border-clay-600 rounded-full ${className}`}
    >
      <span
        style={{ fontSize: glyphSize, lineHeight: 1 }}
        className="font-serif italic text-clay-700 mb-px"
      >
        F
      </span>
      <span
        style={{ fontSize: wmSize, letterSpacing: '0.18em' }}
        className="font-sans uppercase text-clay-700"
      >
        FARMAU
      </span>
    </span>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="FARMAU"
        className="focus:outline-none"
      >
        {inner}
      </button>
    )
  }

  return (
    <Link href="/" aria-label="FARMAU" className="focus:outline-none">
      {inner}
    </Link>
  )
}
