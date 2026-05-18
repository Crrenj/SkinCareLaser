#!/usr/bin/env node
/**
 * Réinjecte les prix saisis dans data/prices.csv dans db/catalog.json.
 *
 * Le CSV doit avoir la colonne product_slug (clé) et new_price (valeur DOP).
 * Les lignes avec new_price vide sont ignorées (le prix existant est gardé).
 *
 * Le script écrit catalog.json en place et affiche un résumé.
 *
 * Usage:
 *   node scripts/prices-import.cjs [data/prices.csv]
 */

const fs = require('fs')
const path = require('path')

const CSV = process.argv[2] || path.join(__dirname, '..', 'data', 'prices.csv')
const CATALOG_PATH = path.join(__dirname, '..', 'db', 'catalog.json')

function parseCsvLine(line) {
  // Parser CSV minimal : gère les "..." et les "" échappés
  const fields = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') inQuotes = false
      else cur += c
    } else {
      if (c === ',') { fields.push(cur); cur = '' }
      else if (c === '"') inQuotes = true
      else cur += c
    }
  }
  fields.push(cur)
  return fields
}

function main() {
  if (!fs.existsSync(CSV)) {
    console.error(`❌ Fichier CSV introuvable : ${CSV}`)
    console.error(`Génère-le d'abord avec : node scripts/prices-export.cjs > data/prices.csv`)
    process.exit(1)
  }

  const lines = fs.readFileSync(CSV, 'utf-8').split('\n').filter(l => l.trim())
  if (lines.length < 2) {
    console.error('❌ CSV vide')
    process.exit(1)
  }

  const headers = parseCsvLine(lines[0])
  const slugIdx = headers.indexOf('product_slug')
  const newPriceIdx = headers.indexOf('new_price')
  if (slugIdx === -1 || newPriceIdx === -1) {
    console.error(`❌ Colonnes manquantes : need product_slug + new_price, trouvé ${headers.join(',')}`)
    process.exit(1)
  }

  const priceMap = new Map()
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i])
    const slug = fields[slugIdx]?.trim()
    const priceStr = fields[newPriceIdx]?.trim()
    if (!slug || !priceStr) continue
    const price = parseFloat(priceStr.replace(',', '.'))
    if (isNaN(price) || price < 0) {
      console.error(`⚠ Prix invalide pour ${slug} : "${priceStr}" — ignoré`)
      continue
    }
    priceMap.set(slug, price)
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'))

  let updated = 0
  let missing = 0
  let totalProducts = 0
  for (const brand of catalog.brands) {
    for (const range of brand.ranges) {
      for (const product of range.products) {
        totalProducts++
        if (priceMap.has(product.slug)) {
          product.price = priceMap.get(product.slug)
          updated++
        } else if (product.price == null) {
          missing++
        }
      }
    }
  }

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2))

  console.error(`✓ catalog.json mis à jour`)
  console.error(`  Prix appliqués : ${updated} / ${totalProducts} produits`)
  console.error(`  Sans prix      : ${missing}`)
  if (missing > 0) {
    console.error(`  → seed-import.cjs traitera les produits sans prix avec le placeholder 25.00 DOP`)
  }
}

main()
