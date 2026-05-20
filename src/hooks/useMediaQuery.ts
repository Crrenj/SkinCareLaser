'use client'

import { useEffect, useState } from 'react'

/**
 * Hook SSR-safe : retourne `true` quand la media query matche côté client.
 * Pendant le SSR + le premier render hydratation, retourne `defaultValue`
 * (par défaut `false`), puis se met à jour au mount + sur changement.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(defaultValue)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    // Safari < 14 utilise addListener/removeListener
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    }
    mql.addListener(handler)
    return () => mql.removeListener(handler)
  }, [query])

  return matches
}
