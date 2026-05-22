'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Brand, Range } from '../_lib/types'

/**
 * Charge en parallèle `brands` (avec leurs `ranges` imbriquées via l'API admin)
 * et `ranges` (liste plate). Les deux sont nécessaires car le modal de gamme
 * a besoin de la liste complète pour le select de marque, et la table principale
 * a besoin des ranges groupées par brand.
 */
export function useBrandsData() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [ranges, setRanges] = useState<Range[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [brandsRes, rangesRes] = await Promise.all([
        fetch('/api/admin/brands'),
        fetch('/api/admin/ranges'),
      ])
      const brandsData = await brandsRes.json()
      const rangesData = await rangesRes.json()

      if (brandsRes.ok && Array.isArray(brandsData)) {
        setBrands(brandsData)
      } else {
        setBrands([])
        if (brandsData.message?.includes('SUPABASE_SERVICE')) {
          toast.error(
            'Configuration manquante: La clé de service Supabase n\'est pas configurée.',
          )
        }
      }
      if (rangesRes.ok && Array.isArray(rangesData)) {
        setRanges(rangesData)
      } else {
        setRanges([])
      }
    } catch (error) {
      console.error('Erreur fetch brands/ranges:', error)
      setBrands([])
      setRanges([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { brands, ranges, loading, refresh }
}
