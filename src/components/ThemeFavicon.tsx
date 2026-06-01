'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Garde le favicon synchronisé avec le thème actif (`<html data-theme>`) à
 * CHAQUE navigation client. Le `<link rel="icon">` statique du root layout
 * n'est posé qu'au chargement initial et n'est pas mis à jour par Next lors
 * des navigations SPA → le favicon restait figé sur le thème de la première
 * page chargée, donnant l'impression qu'il « change » selon la section
 * (surtout l'admin atteint depuis une page publique au thème différent).
 * On réécrit les liens ici à chaque changement de route.
 */
export function ThemeFavicon() {
  const pathname = usePathname()

  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme') || 'terra'

    const setIcon = (size: '16x16' | '32x32', px: string) => {
      let link = document.querySelector<HTMLLinkElement>(`link[rel="icon"][sizes="${size}"]`)
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        link.type = 'image/png'
        link.setAttribute('sizes', size)
        document.head.appendChild(link)
      }
      link.href = `/favicons/${theme}-${px}.png`
    }

    setIcon('32x32', '32')
    setIcon('16x16', '16')

    const apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
    if (apple) apple.href = `/favicons/${theme}-180.png`
  }, [pathname])

  return null
}
