'use client'

import { logger } from '@/lib/logger'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LOW_STOCK_THRESHOLD } from '@/lib/constants'
import type { Brand, Product, Tag, TagType } from '../_lib/types'

type Args = {
  page: number
  search: string
}

/**
 * Charge la liste paginée des produits (avec tags + marque) ainsi que la liste
 * de marques et la liste de tags (consommée par le formulaire d'édition).
 * `refreshProducts()` ne réactualise que les produits, sans toucher aux deux
 * autres (qui ne bougent que rarement).
 */
export function useProductsData({ page, search }: Args) {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [tagTypes, setTagTypes] = useState<TagType[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  // Seuil « stock faible » configuré (shop_settings.low_stock_threshold),
  // renvoyé par la route with-tags — fallback constant tant que pas chargé.
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(LOW_STOCK_THRESHOLD)

  const refreshProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/products/with-tags?page=${page}&limit=10&search=${search}`,
      )
      const data = await res.json()
      if (res.ok && data.products) {
        setProducts(data.products)
        setTotalPages(data.totalPages || 1)
        if (typeof data.lowStockThreshold === 'number') {
          setLowStockThreshold(data.lowStockThreshold)
        }
      } else {
        setProducts([])
        setTotalPages(1)
        if (data.message?.includes('SUPABASE_SERVICE')) {
          toast.error(
            'Configuration manquante: La clé de service Supabase n\'est pas configurée.',
          )
        }
      }
    } catch (error) {
      logger.error('Erreur chargement produits:', error)
      setProducts([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  // Tags + brands sont rarement modifiés, on les charge une fois au mount
  useEffect(() => {
    const fetchStatic = async () => {
      try {
        const [brandsRes, tagsRes, typesRes] = await Promise.all([
          fetch('/api/admin/brands'),
          fetch('/api/admin/tags'),
          fetch('/api/admin/tag-types'),
        ])
        const [brandsData, tagsData, typesData] = await Promise.all([
          brandsRes.json(),
          tagsRes.json(),
          typesRes.json(),
        ])
        if (Array.isArray(brandsData)) setBrands(brandsData)
        if (Array.isArray(tagsData)) setTags(tagsData)
        if (Array.isArray(typesData)) setTagTypes(typesData)
      } catch (error) {
        logger.error('Erreur chargement marques/tags:', error)
      }
    }
    fetchStatic()
  }, [])

  useEffect(() => {
    refreshProducts()
  }, [refreshProducts])

  /**
   * Patch LOCAL d'un produit déjà chargé (mise à jour optimiste) — sans
   * re-fetch ni spinner. Utilisé par le toggle de visibilité : seule la ligne
   * concernée bascule, la table ne « se réinitialise » plus.
   */
  const patchProductLocal = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  return {
    products, brands, tags, tagTypes, loading, totalPages, lowStockThreshold,
    refreshProducts, patchProductLocal,
  }
}
