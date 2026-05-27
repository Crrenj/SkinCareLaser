'use client'

import { logger } from '@/lib/logger'
import { useCallback, useEffect, useState } from 'react'
import { TagIcon } from '@heroicons/react/24/outline'
import { iconMap } from '../_lib/icons'
import type { Tag, TagCategory, TagType } from '../_lib/types'

/**
 * Charge les `tag_types` + `tags` puis groupe les tags par type pour produire
 * un tableau de `TagCategory` consommable par les cards.
 *
 * Le retour expose `refresh()` pour réactualiser après une mutation (create
 * / update / delete) — l'appelant n'a pas à gérer l'état lui-même.
 */
export function useTagsData() {
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([])
  const [tagTypes, setTagTypes] = useState<TagType[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [typesRes, tagsRes] = await Promise.all([
        fetch('/api/admin/tag-types'),
        fetch('/api/admin/tags'),
      ])
      const typesData = await typesRes.json()
      const tagsData = await tagsRes.json()

      if (typesRes.ok && Array.isArray(typesData)) {
        setTagTypes(typesData)
        const grouped: TagCategory[] = typesData.map((type: TagType) => ({
          id: type.id,
          type: type.slug,
          name: type.name,
          icon: iconMap[type.icon || 'TagIcon'] || TagIcon,
          color: type.color,
          tags: (tagsData as Tag[]).filter((tag) => tag.tag_type_id === type.id),
        }))
        setTagCategories(grouped)
      } else {
        logger.error('Erreur chargement données tags:', typesData)
      }
    } catch (error) {
      logger.error('Erreur fetch tags:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { tagCategories, tagTypes, loading, refresh }
}
