'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { BannerData } from '../_lib/types'

/**
 * Charge la liste des bannières. Expose aussi `toggleActive` (PUT direct,
 * pas besoin d'ouvrir un modal) et `swapPositions` (échange deux positions
 * pour réordonner) — les deux re-fetch après mutation.
 */
export function useBannersData() {
  const [banners, setBanners] = useState<BannerData[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/banners')
      const data = await res.json()
      if (res.ok) {
        setBanners(data.banners || [])
      } else {
        console.error('Erreur fetch banners:', data.error)
      }
    } catch (error) {
      console.error('Erreur fetch banners:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggleActive = useCallback(
    async (id: string) => {
      const banner = banners.find((b) => b.id === id)
      if (!banner) return
      try {
        const res = await fetch('/api/admin/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...banner, is_active: !banner.is_active }),
        })
        if (res.ok) {
          await refresh()
        } else {
          const data = await res.json()
          toast.error('Erreur lors de la mise à jour: ' + data.error)
        }
      } catch (error) {
        console.error('Erreur toggle active:', error)
      }
    },
    [banners, refresh],
  )

  const swapPositions = useCallback(
    async (id: string, direction: 'up' | 'down') => {
      const currentIndex = banners.findIndex((b) => b.id === id)
      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' && currentIndex === banners.length - 1)
      ) {
        return
      }
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      const current = banners[currentIndex]
      const target = banners[targetIndex]
      try {
        await Promise.all([
          fetch('/api/admin/banners', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...current, position: target.position }),
          }),
          fetch('/api/admin/banners', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...target, position: current.position }),
          }),
        ])
        await refresh()
      } catch (error) {
        console.error('Erreur swap positions:', error)
      }
    },
    [banners, refresh],
  )

  return { banners, loading, refresh, toggleActive, swapPositions }
}
