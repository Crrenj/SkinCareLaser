'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { isThemeName } from '@/lib/themes'

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ theme: string }>)

/**
 * Garde le favicon synchronisé avec le thème défini dans `/admin/apariencia`,
 * sur TOUTES les routes (public ET admin). On lit le thème LIVE via `/api/theme`
 * (SWR, dédupliqué) et on réécrit les `<link rel="icon">` ; fallback sur
 * `<html data-theme>` le temps du fetch. On RETIRE aussi tout favicon concurrent
 * (ex. `/favicon.ico` auto-injecté) qui n'est pas une de nos icônes de thème —
 * sinon le navigateur l'affichait à la place du colibri (constaté en admin).
 * Réasserté à chaque navigation (`pathname`).
 */
export function ThemeFavicon() {
  const pathname = usePathname()
  const { data } = useSWR<{ theme: string }>('/api/theme', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })

  useEffect(() => {
    const live = data?.theme
    const htmlTheme = document.documentElement.getAttribute('data-theme')
    const theme = isThemeName(live) ? live : isThemeName(htmlTheme) ? htmlTheme : 'terra'

    // Retire les favicons concurrents (qui ne pointent pas vers /favicons/…).
    document
      .querySelectorAll(
        'link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"]',
      )
      .forEach((el) => {
        const href = el.getAttribute('href') || ''
        if (!href.startsWith('/favicons/')) el.remove()
      })

    const setIcon = (rel: string, size: string, px: string) => {
      let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"][sizes="${size}"]`)
      if (!link) {
        link = document.createElement('link')
        link.rel = rel
        link.type = 'image/png'
        link.setAttribute('sizes', size)
        document.head.appendChild(link)
      }
      link.href = `/favicons/${theme}-${px}.png`
    }

    setIcon('icon', '32x32', '32')
    setIcon('icon', '16x16', '16')
    setIcon('apple-touch-icon', '180x180', '180')
  }, [data, pathname])

  return null
}
