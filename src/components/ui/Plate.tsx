import type { ReactNode } from 'react'
import { FarmauBird } from '@/components/brand/FarmauLogo'

const HATCH_LIGHT =
  'repeating-linear-gradient(135deg, transparent, transparent 11px, rgba(31,27,22,0.035) 11px, rgba(31,27,22,0.035) 12px)'
const HATCH_DARK =
  'repeating-linear-gradient(135deg, transparent, transparent 11px, rgba(255,255,255,0.04) 11px, rgba(255,255,255,0.04) 12px)'

interface PlateProps {
  /** Fond sombre (sur ink) au lieu de sand. */
  dark?: boolean
  /** Affiche un colibri FARMAU discret au centre (emplacements image larges). */
  mark?: boolean
  /** Classes utilitaires (aspect-ratio, rounded, taille, bordures…). */
  className?: string
  children?: ReactNode
}

/**
 * Placeholder éditorial « plaque » — fine texture hachurée qui remplace les
 * dégradés/blobs de l'ancienne home. Reçoit le vrai visuel quand il existe
 * (sinon un colibri FARMAU discret). Réplique `.plate` du handoff home-moderna,
 * sans les légendes monospace « quelle photo va ici » (artefacts de handoff).
 */
export function Plate({ dark = false, mark = false, className = '', children }: PlateProps) {
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center border ${
        dark ? 'bg-ink-800 border-ink-700' : 'bg-sand-100 border-sand-300'
      } ${className}`}
      style={{ backgroundImage: dark ? HATCH_DARK : HATCH_LIGHT }}
    >
      {mark && (
        <FarmauBird size={76} color={dark ? '#807969' : '#CCC5BD'} className="opacity-50" />
      )}
      {children}
    </div>
  )
}
