import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export type PromotionTargetInput = {
  target_type: 'product' | 'brand' | 'range' | 'tag'
  target_id: string
}

const TARGET_TABLES: Record<PromotionTargetInput['target_type'], 'products' | 'brands' | 'ranges' | 'tags'> = {
  product: 'products',
  brand: 'brands',
  range: 'ranges',
  tag: 'tags',
}

/** Vérifie que chaque target_id existe dans sa table (batch par type, ≤4 requêtes). */
export async function validatePromotionTargets(
  sb: SupabaseClient<Database>,
  targets: PromotionTargetInput[],
): Promise<boolean> {
  const byType: Record<PromotionTargetInput['target_type'], string[]> = {
    product: [], brand: [], range: [], tag: [],
  }
  for (const t of targets) byType[t.target_type].push(t.target_id)
  for (const type of Object.keys(byType) as PromotionTargetInput['target_type'][]) {
    const ids = [...new Set(byType[type])]
    if (ids.length === 0) continue
    const { data } = await sb.from(TARGET_TABLES[type]).select('id').in('id', ids)
    const found = new Set((data ?? []).map((r) => r.id))
    if (ids.some((id) => !found.has(id))) return false
  }
  return true
}
