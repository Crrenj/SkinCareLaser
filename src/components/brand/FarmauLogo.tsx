'use client'

import { Link } from '@/i18n/navigation'
import type { CSSProperties } from 'react'

/** CSSProperties + custom properties `--*` (variables CSS du logo). */
type CSSVars = CSSProperties & Record<`--${string}`, string | number>

/**
 * Logo FARMAU monochrome (web). Le colibri seul (sans disque) est recoloré
 * via `mask-image` + `--c-bird` (couleur du thème actif). Le logo OFFICIEL
 * avec disque reste réservé au favicon et aux supports imprimés.
 *
 * Cf. handoff `design_handoff_themes_system/`. Classes CSS dans globals.css.
 */

type BirdProps = {
  /** Diamètre en px. Défaut 80. */
  size?: number
  /** Override couleur (sinon `--c-bird` du thème). */
  color?: string
  className?: string
}

export function FarmauBird({ size = 80, color, className = '' }: BirdProps) {
  const style: CSSVars = {
    '--logo-size': `${size}px`,
    ...(color ? { '--bird-color': color } : {}),
  }
  return <span aria-hidden className={`farmau-bird ${className}`} style={style} />
}

type WordProps = {
  /** Largeur en px. Défaut 120. La hauteur suit le ratio natif (286/374). */
  width?: number
  color?: string
  className?: string
}

export function FarmauWord({ width = 120, color, className = '' }: WordProps) {
  const style: CSSVars = {
    '--word-size': `${width}px`,
    ...(color ? { '--word-color': color } : {}),
  }
  return <span aria-hidden className={`farmau-word ${className}`} style={style} />
}

type LockupProps = {
  /** Taille du colibri en px. */
  birdSize?: number
  /** Largeur du wordmark en px. */
  wordWidth?: number
  /** Masquer le wordmark (colibri seul). */
  showWord?: boolean
  /** Couleur du colibri (sinon `--c-bird`). */
  birdColor?: string
  /** Couleur du wordmark (sinon `--c-text`). */
  wordColor?: string
  /** Si fourni, rend un bouton plutôt qu'un lien (drawer mobile…). */
  onClick?: () => void
  className?: string
}

/**
 * Lockup horizontal colibri + wordmark, cliquable (Link vers `/` par défaut,
 * ou bouton si `onClick`). Remplace l'ancien composant `Logo`.
 */
export function FarmauLockup({
  birdSize = 44,
  wordWidth = 74,
  showWord = true,
  birdColor,
  wordColor,
  onClick,
  className = '',
}: LockupProps) {
  const inner = (
    <>
      <FarmauBird size={birdSize} color={birdColor} />
      {showWord && <FarmauWord width={wordWidth} color={wordColor} />}
    </>
  )
  const shared =
    'inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700 rounded-sm'

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label="FARMAU" className={`${shared} ${className}`}>
        {inner}
      </button>
    )
  }
  return (
    <Link href="/" aria-label="FARMAU" className={`${shared} ${className}`}>
      {inner}
    </Link>
  )
}

export default FarmauLockup
