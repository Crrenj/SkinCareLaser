'use client'

import { useEffect } from 'react'

/**
 * Quand la page est rendue DANS une iframe same-origin (aperçu « page d'accueil
 * complète » de `/admin/annonce`), poste sa hauteur réelle au parent pour qu'il
 * dimensionne l'aperçu sans blanc ni coupe. Totalement inerte hors iframe
 * (`window.parent === window.self`) — aucun effet sur le site public normal.
 */
export function IframeHeightReporter() {
  useEffect(() => {
    if (window.parent === window.self) return

    const post = () => {
      try {
        window.parent.postMessage(
          { type: 'farmau:preview-height', height: document.documentElement.scrollHeight },
          window.location.origin,
        )
      } catch {
        // parent cross-origin / indisponible — ignoré
      }
    }

    post()
    const ro = new ResizeObserver(post)
    ro.observe(document.documentElement)
    window.addEventListener('load', post)
    return () => {
      ro.disconnect()
      window.removeEventListener('load', post)
    }
  }, [])

  return null
}
