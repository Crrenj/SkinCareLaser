'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { isThemeName } from '@/lib/themes'

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ theme: string }>)

/**
 * Garde le favicon synchronisé avec le thème défini dans `/admin/apariencia`,
 * sur TOUTES les routes. Le `<link rel="icon">` statique du root layout est
 * baké par page (et figé en navigation SPA), donc il pouvait afficher un thème
 * périmé/incohérent selon la section. On lit le thème LIVE via `/api/theme`
 * (SWR, dédupliqué) et on réécrit les liens ; fallback sur `<html data-theme>`
 * le temps du fetch (pas de flash).
 */
export function ThemeFavicon() {
  const { data } = useSWR<{ theme: string }>('/api/theme', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })

  useEffect(() => {
    const live = data?.theme
    const htmlTheme = document.documentElement.getAttribute('data-theme')
    const theme = isThemeName(live)
      ? live
      : isThemeName(htmlTheme)
        ? htmlTheme
        : 'terra'

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
  }, [data])

  return null
}
