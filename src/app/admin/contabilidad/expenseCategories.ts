// Catégories de dépenses — module neutre (importable côté serveur ET client ;
// ne PAS importer _data.ts ici qui tire supabaseAdmin/secret côté serveur).

export const CATEGORIES: { value: string; label: string }[] = [
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'salarios', label: 'Salarios' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'mercadeo', label: 'Mercadeo' },
  { value: 'suministros', label: 'Suministros' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'otros', label: 'Otros' },
]

// CAT_LABEL couvre les catégories du formulaire manuel (CATEGORIES) PLUS la
// catégorie 'merma' (écrite uniquement par la RPC record_stock_loss, jamais
// proposée dans le <select> d'ajout manuel) → la ventilation P&L et la liste
// des dépenses libellent « Mermas y pérdidas » au lieu du slug brut.
export const CAT_LABEL: Record<string, string> = {
  ...Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label])),
  merma: 'Mermas y pérdidas',
}
