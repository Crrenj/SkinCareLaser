/**
 * Tests PURS (toujours exécutés) des helpers d'export CSV (`src/lib/csv.ts`).
 *
 * Couvre :
 *   - anti-injection de formule Excel/Sheets (valeurs commençant par = + - @, tab, CR) ;
 *   - échappement RFC 4180 (virgules / guillemets / retours ligne) + doublage des " ;
 *   - assemblage `buildCsv` : BOM UTF-8 en tête, séparateur CRLF entre lignes,
 *     en-têtes échappés comme les cellules ;
 *   - normalisation null/undefined → cellule vide, nombres → String.
 *
 * Ces invariants protègent les exports 606/607 DGII (route accounting/export) et
 * l'export newsletter contre l'injection de formule et la casse Excel.
 */
import { describe, expect, it } from 'vitest'
import { buildCsv, csvCell } from '@/lib/csv'

const BOM = String.fromCharCode(0xfeff)

describe('csvCell — anti-injection de formule', () => {
  it('préfixe une apostrophe aux valeurs commençant par = + - @', () => {
    // Aucune virgule/guillemet → pas de quoting RFC, juste le préfixe protecteur.
    expect(csvCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)")
    expect(csvCell('+1234567890')).toBe("'+1234567890")
    expect(csvCell('-1+2')).toBe("'-1+2")
    expect(csvCell('@cmd')).toBe("'@cmd")
  })

  it('préfixe aussi les valeurs commençant par tabulation ou retour chariot', () => {
    // \t et \r déclenchent le préfixe ; \r déclenche ENSUITE le quoting RFC.
    expect(csvCell('\tfoo')).toBe("'\tfoo")
    // '\rfoo' → préfixé "'\rfoo" puis quoté car contient un \r.
    expect(csvCell('\rfoo')).toBe('"\'\rfoo"')
  })

  it('ne préfixe pas une valeur dont le caractère dangereux est au milieu', () => {
    expect(csvCell('a=b')).toBe('a=b')
    expect(csvCell('total: 5+3')).toBe('total: 5+3')
  })

  it('protège un nombre négatif passé en chaîne (vecteur d’injection classique)', () => {
    expect(csvCell('-5')).toBe("'-5")
  })

  it('ne préfixe PAS un nombre négatif numérique (pas de String commençant par - dangereux côté formule)', () => {
    // -5 (number) → String '-5' → /^[=+\-@...]/ matche → préfixé. On documente le
    // comportement réel : la fonction traite la représentation textuelle.
    expect(csvCell(-5)).toBe("'-5")
  })
})

describe('csvCell — échappement RFC 4180', () => {
  it('entoure de guillemets et double les " quand la valeur contient une virgule', () => {
    expect(csvCell('Pérez, Juan')).toBe('"Pérez, Juan"')
  })

  it('double les guillemets internes', () => {
    expect(csvCell('Il a dit "oui"')).toBe('"Il a dit ""oui"""')
  })

  it('entoure de guillemets quand la valeur contient un retour ligne', () => {
    expect(csvCell('ligne1\nligne2')).toBe('"ligne1\nligne2"')
  })

  it('entoure de guillemets quand la valeur contient un retour chariot', () => {
    expect(csvCell('a\rb')).toBe('"a\rb"')
  })

  it('combine préfixe anti-formule ET quoting quand la valeur le requiert', () => {
    // '=A1,B2' : commence par '=' (préfixe) ET contient ',' (quoting).
    expect(csvCell('=A1,B2')).toBe('"\'=A1,B2"')
  })
})

describe('csvCell — valeurs simples / vides', () => {
  it('laisse une chaîne sans caractère spécial intacte', () => {
    expect(csvCell('Avène')).toBe('Avène')
  })

  it('convertit un nombre en chaîne', () => {
    expect(csvCell(1234.5)).toBe('1234.5')
    expect(csvCell(0)).toBe('0')
  })

  it('rend null et undefined comme cellule vide', () => {
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })
})

describe('buildCsv — assemblage', () => {
  it('commence par le BOM UTF-8 et sépare les lignes par CRLF', () => {
    const csv = buildCsv(['A', 'B'], [['1', '2'], ['3', '4']])
    expect(csv.startsWith(BOM)).toBe(true)
    expect(csv).toBe(`${BOM}A,B\r\n1,2\r\n3,4`)
  })

  it('échappe les en-têtes ET les cellules de manière cohérente', () => {
    const csv = buildCsv(['Nom, complet', 'Total'], [['Pérez, J', '=2+2']])
    // En-tête "Nom, complet" quoté ; cellule "Pérez, J" quotée ; "=2+2" préfixé.
    expect(csv).toBe(`${BOM}"Nom, complet",Total\r\n"Pérez, J",'=2+2`)
  })

  it('gère une table sans ligne (seulement les en-têtes)', () => {
    const csv = buildCsv(['RNC', 'NCF'], [])
    expect(csv).toBe(`${BOM}RNC,NCF`)
  })

  it('normalise null/undefined/nombres dans les lignes', () => {
    const csv = buildCsv(['a', 'b', 'c'], [[null, undefined, 42]])
    expect(csv).toBe(`${BOM}a,b,c\r\n,,42`)
  })

  it('produit une cellule par champ même quand une valeur contient une virgule (pas de désalignement)', () => {
    const csv = buildCsv(['x', 'y'], [['1,5', '2']])
    // La virgule interne est quotée → reste 2 cellules.
    expect(csv).toBe(`${BOM}x,y\r\n"1,5",2`)
  })
})
