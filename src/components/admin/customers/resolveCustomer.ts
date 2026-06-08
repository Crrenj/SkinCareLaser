import type { CustomerSelection } from './CustomerStep'
import type { AccountSetupInfo } from './AccountSetupDialog'

/**
 * Résout une sélection client en `user_id` (+ éventuel lien de configuration) :
 *  - `account` → user_id existant ;
 *  - `create`  → crée un compte express (POST quick-create) → user_id + lien ;
 *  - `guest` / `anonymous` → pas de compte.
 *
 * Partagé par la vente comptoir (/ventas) et la réservation manuelle
 * (/reservations). Lève en cas d'échec de création (le caller affiche le toast).
 */
export async function resolveCustomer(
  customer: CustomerSelection | undefined,
  locale: string,
): Promise<{ userId: string | null; setup: AccountSetupInfo | null }> {
  if (!customer) return { userId: null, setup: null }

  if (customer.mode === 'account') {
    return { userId: customer.userId || null, setup: null }
  }

  if (customer.mode === 'create') {
    const res = await fetch('/api/admin/users/quick-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: customer.firstName,
        last_name: customer.lastName,
        phone: customer.phone,
        locale,
      }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || 'quick-create failed')
    return {
      userId: json.userId ?? null,
      setup: json.setupLink
        ? { link: json.setupLink, phone: customer.phone, name: json.name ?? null }
        : null,
    }
  }

  // guest / anonymous → aucune association de compte.
  return { userId: null, setup: null }
}
