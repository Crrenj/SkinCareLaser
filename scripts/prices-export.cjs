#!/usr/bin/env node
/**
 * Exporte db/catalog.json en CSV pour saisie des prix dans Excel/Numbers.
 *
 * Colonnes :
 *   brand, range, product_slug, product_name, description (tronquée), current_price, new_price
 *
 * Écrit directement dans data/prices.csv (crée le dossier si besoin).
 *
 * Usage:
 *   node scripts/prices-export.cjs            # → data/prices.csv
 *   node scripts/prices-export.cjs -          # → stdout (pour piper)
 */

const fs = require('fs')
const path = require('path')

const CATALOG = require(path.join(__dirname, '..', 'db', 'catalog.json'))
const OUTPUT = path.join(__dirname, '..', 'data', 'prices.csv')

function escape(s) {
  if (s == null) return ''
  const str = String(s)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

const lines = [
  ['brand', 'range', 'product_slug', 'product_name', 'description', 'current_price', 'new_price'].join(',')
]

for (const brand of CATALOG.brands) {
  for (const range of brand.ranges) {
    for (const product of range.products) {
      const desc = product.description.length > 120
        ? product.description.slice(0, 117) + '...'
        : product.description
      lines.push([
        escape(brand.name),
        escape(range.name),
        escape(product.slug),
        escape(product.name),
        escape(desc),
        escape(product.price ?? ''),
        '',
      ].join(','))
    }
  }
}

const content = lines.join('\n') + '\n'

if (process.argv[2] === '-') {
  process.stdout.write(content)
} else {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, content)
  console.error(`✓ Écrit ${lines.length - 1} produits dans ${path.relative(process.cwd(), OUTPUT)}`)
  console.error(`  Édite ce fichier dans Excel/Numbers, puis : npm run prices:import`)
}
