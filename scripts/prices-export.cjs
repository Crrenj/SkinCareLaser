#!/usr/bin/env node
/**
 * Exporte db/catalog.json en CSV pour saisie des prix dans Excel/Numbers.
 *
 * Colonnes :
 *   brand, range, product_slug, product_name, description (tronquée), current_price, new_price
 *
 * current_price contient le prix déjà fixé dans catalog.json (sinon vide).
 * new_price est la colonne à remplir.
 *
 * Usage:
 *   node scripts/prices-export.cjs > data/prices.csv
 */

const fs = require('fs')
const path = require('path')

const CATALOG = require(path.join(__dirname, '..', 'db', 'catalog.json'))

function escape(s) {
  if (s == null) return ''
  const str = String(s)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

console.log(['brand', 'range', 'product_slug', 'product_name', 'description', 'current_price', 'new_price'].join(','))

for (const brand of CATALOG.brands) {
  for (const range of brand.ranges) {
    for (const product of range.products) {
      const desc = product.description.length > 120
        ? product.description.slice(0, 117) + '...'
        : product.description
      console.log([
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
