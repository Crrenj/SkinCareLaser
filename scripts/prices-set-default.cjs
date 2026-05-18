#!/usr/bin/env node
/**
 * Met un prix uniforme sur tous les produits de db/catalog.json.
 *
 * Utile pour ne pas avoir à saisir 353 prix : seed-import les activera tous
 * (is_active = true) avec ce prix. Tu corriges ensuite via /admin/product.
 *
 * Usage:
 *   node scripts/prices-set-default.cjs 25       # tous à 25 DOP
 *   node scripts/prices-set-default.cjs 25 --only-missing
 *     → ne touche que les produits sans prix (préserve ce que tu as
 *       éventuellement déjà saisi via prices:import)
 */

const fs = require('fs')
const path = require('path')

const CATALOG_PATH = path.join(__dirname, '..', 'db', 'catalog.json')

const price = parseFloat(process.argv[2])
const onlyMissing = process.argv.includes('--only-missing')

if (isNaN(price) || price < 0) {
  console.error('Usage: node scripts/prices-set-default.cjs <prix> [--only-missing]')
  console.error('Exemple: node scripts/prices-set-default.cjs 25')
  process.exit(1)
}

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'))

let updated = 0
let skipped = 0
let total = 0
for (const brand of catalog.brands) {
  for (const range of brand.ranges) {
    for (const product of range.products) {
      total++
      if (onlyMissing && typeof product.price === 'number' && product.price > 0) {
        skipped++
        continue
      }
      product.price = price
      updated++
    }
  }
}

fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2))

console.error(`✓ catalog.json mis à jour`)
console.error(`  Produits modifiés : ${updated} / ${total}`)
if (onlyMissing) console.error(`  Préservés (prix déjà saisi) : ${skipped}`)
console.error(`  Prix appliqué : ${price} DOP`)
console.error(``)
console.error(`Lance maintenant : npm run seed-import -- --dry-run`)
console.error(`Tous les produits seront importés avec is_active = true.`)
