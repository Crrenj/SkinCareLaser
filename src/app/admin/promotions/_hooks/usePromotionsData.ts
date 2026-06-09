'use client'

import { logger } from '@/lib/logger'
import { useCallback, useEffect, useState } from 'react'
import type { Promotion } from '../_lib/types'

export function usePromotionsData() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/promotions')
      if (!res.ok) throw new Error('fetch_failed')
      const data = (await res.json()) as { promotions: Promotion[] }
      setPromotions(data.promotions ?? [])
    } catch (error) {
      logger.error('Erreur récupération promotions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { promotions, loading, refresh }
}
