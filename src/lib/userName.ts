type NameParts = {
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
}

/**
 * Règle d'affichage des noms (décision 2026-06-11) :
 *  - ADMIN  → le pseudo `display_name` (éditable par l'équipe via /admin/admins),
 *             fallback nom + prénom si aucun pseudo n'est posé.
 *  - CLIENT → nom + prénom (`last_name` puis `first_name`), jamais le pseudo ;
 *             fallback pseudo uniquement si le profil n'a aucun nom (ex. comptes
 *             historiques créés avant la saisie obligatoire).
 */
export function formatAdminName(p: NameParts): string {
  return p.displayName?.trim() || joinName(p)
}

export function formatClientName(p: NameParts): string {
  return joinName(p) || p.displayName?.trim() || ''
}

function joinName(p: NameParts): string {
  return [p.lastName, p.firstName]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(' ')
}
