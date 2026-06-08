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

export const CAT_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
)
