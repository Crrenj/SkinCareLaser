/**
 * Fenêtre de pagination avec ellipses : `1 … 4 [5] 6 … 36`.
 *
 * Extrait de CataloguePagination (qui gardait sa copie locale) et CORRIGÉ au
 * passage : l'ancienne version dupliquait `total - 1` quand la page courante
 * touchait la fin (`[1, …, 35, 35, 36]` → bouton en double + collision de
 * clés React). Règles :
 *   - `total ≤ 7` → liste plate (aucune ellipse) ;
 *   - première et dernière page toujours visibles ;
 *   - fenêtre de ± `siblings` autour de la page courante ;
 *   - une ellipse ne masque jamais UNE seule page (on affiche la page).
 */
export function buildPageRange(
  current: number,
  total: number,
  siblings = 1,
): Array<number | 'ellipsis'> {
  if (total <= 0) return []
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const first = 1
  const last = total
  const start = Math.max(first + 1, current - siblings)
  const end = Math.min(last - 1, current + siblings)

  const out: Array<number | 'ellipsis'> = [first]
  if (start > first + 2) out.push('ellipsis')
  else if (start === first + 2) out.push(first + 1)
  for (let i = start; i <= end; i++) out.push(i)
  if (end < last - 2) out.push('ellipsis')
  else if (end === last - 2) out.push(last - 1)
  out.push(last)
  return out
}
