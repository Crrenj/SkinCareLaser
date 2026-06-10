/**
 * Sérialise un objet JSON-LD pour injection via dangerouslySetInnerHTML.
 *
 * `JSON.stringify` seul n'échappe PAS `</script>` : une valeur (nom de
 * produit, titre de post… éditables en admin) contenant `</script><script>`
 * fermerait le bloc JSON-LD et exécuterait du script arbitraire (XSS stockée).
 * On neutralise `<`, `>` et `&` en échappements unicode JSON — le résultat
 * reste du JSON strictement équivalent pour les parsers schema.org.
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
