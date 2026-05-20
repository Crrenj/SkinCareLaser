'use client'

import { useCallback } from 'react'
import useSWR from 'swr'

type WishlistResponse = { productIds: string[] }
type ToggleResponse = { added: boolean; error?: string }

const fetcher = (url: string) =>
  fetch(url, { credentials: 'same-origin' }).then((r) => {
    if (r.status === 401) return { productIds: [] } satisfies WishlistResponse
    if (!r.ok) throw new Error('wishlist_fetch_failed')
    return r.json() as Promise<WishlistResponse>
  })

/**
 * Hook favoris : retourne la liste productIds + helpers toggle/has.
 *
 * - Anonyme : productIds = [], toggle = noop (le bouton heart redirige
 *   vers /login côté UI).
 * - Authentifié : SWR fetch /api/wishlist, optimistic mutate au toggle.
 */
export function useWishlist() {
  const { data, mutate, isLoading } = useSWR<WishlistResponse>(
    '/api/wishlist',
    fetcher,
    { revalidateOnFocus: false },
  )

  const productIds = data?.productIds ?? []

  const has = useCallback(
    (productId: string) => productIds.includes(productId),
    [productIds],
  )

  const toggle = useCallback(
    async (productId: string): Promise<{ ok: boolean; needAuth?: boolean }> => {
      // Optimistic
      const optimistic: WishlistResponse = {
        productIds: productIds.includes(productId)
          ? productIds.filter((id) => id !== productId)
          : [...productIds, productId],
      }
      mutate(optimistic, { revalidate: false })

      try {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId }),
          credentials: 'same-origin',
        })

        if (res.status === 401) {
          // Rollback
          mutate(data, { revalidate: false })
          return { ok: false, needAuth: true }
        }

        const json = (await res.json()) as ToggleResponse
        if (!res.ok) {
          mutate(data, { revalidate: false })
          return { ok: false }
        }

        // Resync au cas où le serveur aurait une vue différente
        mutate()
        return { ok: true }
      } catch {
        mutate(data, { revalidate: false })
        return { ok: false }
      }
    },
    [productIds, data, mutate],
  )

  return { productIds, has, toggle, isLoading }
}
