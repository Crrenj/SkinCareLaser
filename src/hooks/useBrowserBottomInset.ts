'use client'

import { useEffect } from 'react'

/**
 * Maintient une variable CSS `--browser-bottom-inset` (sur `<html>`) égale à la
 * hauteur de la barre d'outils basse du navigateur qui recouvre le bas du layout
 * viewport — typiquement la barre d'adresse de Safari iOS quand l'utilisateur l'a
 * placée EN BAS.
 *
 * Pourquoi : un élément `position: fixed` se cale sur le *layout viewport* (le
 * grand viewport iOS), dont le bord inférieur passe DERRIÈRE la barre Safari. Or
 * `env(safe-area-inset-bottom)` ne couvre que le home-indicator, jamais la barre
 * d'URL → un bouton flottant à `bottom: 24px` se retrouve à moitié caché derrière
 * elle et n'est plus cliquable (les taps atteignent le chrome du navigateur).
 *
 * On mesure l'écart réel via l'API `visualViewport` (le viewport *visible*) et on
 * l'expose en CSS. Les surfaces flottantes l'utilisent ainsi :
 *   bottom: calc(24px + max(env(safe-area-inset-bottom, 0px), var(--browser-bottom-inset, 0px)))
 *
 * `max(...)` évite le double-comptage : barre affichée → l'inset visualViewport
 * domine (il inclut déjà le home-indicator) ; barre masquée → l'inset retombe à 0
 * et `env(...)` reprend la main pour le home-indicator.
 */
export function useBrowserBottomInset() {
  useEffect(() => {
    const vv = window.visualViewport
    const root = document.documentElement
    if (!vv) return

    let raf = 0
    const update = () => {
      raf = 0
      // Partie du layout viewport masquée sous le viewport visible = chrome bas.
      let hidden = root.clientHeight - vv.height - vv.offsetTop
      // Un clavier logiciel produirait un inset bien plus grand qu'une barre
      // d'URL (jamais > ~120px) → au-delà de 180px on l'ignore (fallback env()).
      if (!Number.isFinite(hidden) || hidden < 1 || hidden > 180) hidden = 0
      root.style.setProperty('--browser-bottom-inset', `${Math.round(hidden)}px`)
    }
    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    update()
    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      root.style.removeProperty('--browser-bottom-inset')
    }
  }, [])
}
