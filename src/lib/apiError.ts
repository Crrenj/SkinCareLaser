import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Réponse d'erreur API normalisée.
 *
 * Logge l'erreur réelle côté serveur (via `logger`) et ne renvoie au client
 * qu'un message générique — JAMAIS `error.message` brut, qui peut divulguer des
 * noms de tables/colonnes/contraintes Postgres, des chemins serveur, ou des
 * détails d'implémentation utiles à un attaquant.
 *
 * Réserver aux erreurs INTERNES (5xx). Pour une erreur de validation 4xx dont
 * le détail est utile au client (ex. Zod), renvoyer ce détail explicitement.
 */
export function apiError(
  userMessage: string,
  error?: unknown,
  status = 500,
): NextResponse {
  if (error !== undefined) logger.error(`[api ${status}] ${userMessage}`, error)
  return NextResponse.json({ error: userMessage }, { status })
}
