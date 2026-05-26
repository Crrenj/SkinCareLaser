'use client'

import { Link } from '@/i18n/navigation'

interface LogoProps {
  /** Diamètre du cercle en px. Défaut 64. */
  size?: number
  /** Si fourni, le logo n'est pas un Link mais déclenche ce handler (utile dans le drawer). */
  onClick?: () => void
  className?: string
  /** "default" = sand-50 bg + clay border. "clay" = solid clay-700 bg + sand-50 text. */
  variant?: 'default' | 'clay'
}

/**
 * Logo FARMAU : cercle sand-50 avec bord clay-600,
 * glyph « F » en Instrument Serif italic + wordmark « FARMAU » dessous.
 * Tient en 48 / 64 / 96 px selon le contexte.
 */
export default function Logo({ size = 64, onClick, className = '', variant = 'default' }: LogoProps) {
  const glyphSize = Math.round(size * 0.41)
  const wmSize = Math.max(6, Math.round(size * 0.11))
  const isClay = variant === 'clay'

  const inner = (
    <span
      style={{ width: size, height: size }}
      className={`relative flex flex-col items-center justify-center rounded-full ${
        isClay
          ? 'bg-clay-700 border-0'
          : 'bg-sand-50 border-[1.5px] border-clay-600'
      } ${className}`}
    >
      <span
        style={{ fontSize: glyphSize, lineHeight: 1 }}
        className={`font-serif italic mb-px ${isClay ? 'text-sand-50' : 'text-clay-700'}`}
      >
        F
      </span>
      <span
        style={{ fontSize: wmSize, letterSpacing: '0.18em' }}
        className={`font-sans uppercase ${isClay ? 'text-sand-50' : 'text-clay-700'}`}
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
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
      >
        {inner}
      </button>
    )
  }

  return (
    <Link href="/" aria-label="FARMAU" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700">
      {inner}
    </Link>
  )
}
