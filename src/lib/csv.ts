// Helpers d'export CSV partagés. Anti-injection de formule (Excel/Sheets) +
// échappement RFC 4180 + BOM UTF-8 et CRLF pour une ouverture propre sous Excel.

const BOM = String.fromCharCode(0xfeff)

/** Échappe une cellule CSV et neutralise l'injection de formule. */
export function csvCell(value: string | number | null | undefined): string {
  let v = value == null ? '' : String(value)
  // Préfixe une apostrophe aux valeurs commençant par =, +, -, @, tab ou CR
  // (sinon Excel/Sheets les évalue comme des formules).
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`
  if (v.includes(',') || v.includes('"') || v.includes('\n') || v.includes('\r')) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

/** Assemble un CSV (BOM UTF-8 + CRLF) depuis des en-têtes et des lignes. */
export function buildCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const lines = [
    headers.map(csvCell).join(','),
    ...rows.map((r) => r.map(csvCell).join(',')),
  ]
  return BOM + lines.join('\r\n')
}
