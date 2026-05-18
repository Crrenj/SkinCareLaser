#!/usr/bin/env node
/**
 * Audit du catalog.json — flagger les anomalies extraites par le parser PDF.
 *
 * Vérifications :
 *   - Descriptions tronquées (terminent par "y", "con", "que", virgule, etc.)
 *   - Descriptions trop courtes (< 20 chars)
 *   - Descriptions trop longues (> 800 chars — fusion incorrecte)
 *   - Noms de gammes louches (longueur > 40, multi-mots inhabituels)
 *   - Noms de produits louches (commencent par minuscule, contiennent "uso/para/aplicar")
 *   - Produits sans tags
 *   - Slugs dupliqués
 *   - Images sans produit / produits sans image (positional gap)
 *
 * Génère db/catalog-audit.md (markdown éditable).
 *
 * Usage:
 *   node scripts/validate-catalog.cjs
 */

const fs = require('fs')
const path = require('path')

const CATALOG = require(path.join(__dirname, '..', 'db', 'catalog.json'))
const OUTPUT = path.join(__dirname, '..', 'db', 'catalog-audit.md')

const TRUNCATED_END = /\b(y|con|que|para|por|en|de|del|al|a|los|las|el|la)[,.]?$/i
const TRAILING_PUNCT = /[,;:]$/
const SUSPICIOUS_START = /^(uso|para|contiene|aplicar|usar|ojo|otros|nota)/i

const sections = {
  truncatedDescriptions: [],
  shortDescriptions: [],
  longDescriptions: [],
  suspiciousRangeNames: [],
  suspiciousProductNames: [],
  productsWithoutTags: [],
  duplicateSlugs: [],
  imageDeficit: [],
  imageSurplus: [],
}

// Détection des slugs dupliqués
const slugsSeen = new Map()

for (const brand of CATALOG.brands) {
  let positionalIdx = 0
  const allImages = brand.image_files

  // Stats par marque pour image deficit/surplus
  let totalProducts = 0

  for (const range of brand.ranges) {
    // Range name louche ?
    if (range.name.length > 40 || range.name.split(/\s+/).length > 6) {
      sections.suspiciousRangeNames.push({
        brand: brand.slug,
        range: range.name,
        description: range.description,
      })
    }

    for (const product of range.products) {
      totalProducts++
      const ref = `${brand.slug}/${range.slug}/${product.slug}`

      // Slug dupliqué ?
      if (slugsSeen.has(product.slug)) {
        sections.duplicateSlugs.push({
          slug: product.slug,
          firstSeen: slugsSeen.get(product.slug),
          duplicateAt: ref,
        })
      } else {
        slugsSeen.set(product.slug, ref)
      }

      // Description tronquée ?
      const desc = product.description.trim()
      if (TRUNCATED_END.test(desc) || TRAILING_PUNCT.test(desc)) {
        sections.truncatedDescriptions.push({
          ref,
          name: product.name,
          description: desc,
          end: desc.slice(-50),
        })
      }

      // Description trop courte ?
      if (desc.length < 20) {
        sections.shortDescriptions.push({
          ref,
          name: product.name,
          length: desc.length,
          description: desc,
        })
      }

      // Description trop longue ? (fusion de plusieurs produits probable)
      if (desc.length > 800) {
        sections.longDescriptions.push({
          ref,
          name: product.name,
          length: desc.length,
          preview: desc.slice(0, 150) + '...',
        })
      }

      // Nom produit louche ?
      if (SUSPICIOUS_START.test(product.name)) {
        sections.suspiciousProductNames.push({
          ref,
          name: product.name,
        })
      }

      // Sans tags ?
      const tagCount = (product.tags.skin_type?.length || 0)
        + (product.tags.need?.length || 0)
        + (product.tags.ingredient?.length || 0)
      if (tagCount === 0) {
        sections.productsWithoutTags.push({
          ref,
          name: product.name,
          description: desc.slice(0, 80) + (desc.length > 80 ? '...' : ''),
        })
      }
    }
  }

  // Déficit / surplus d'images
  const imgCount = brand.image_files.length
  if (totalProducts > imgCount) {
    sections.imageDeficit.push({
      brand: brand.slug,
      products: totalProducts,
      images: imgCount,
      missing: totalProducts - imgCount,
    })
  } else if (imgCount > totalProducts) {
    sections.imageSurplus.push({
      brand: brand.slug,
      products: totalProducts,
      images: imgCount,
      surplus: imgCount - totalProducts,
    })
  }
}

// Génère le rapport markdown
const lines = []
lines.push(`# Audit du catalog.json`)
lines.push('')
lines.push(`Généré le ${new Date().toISOString()}`)
lines.push('')

const total = CATALOG.brands.reduce((s, b) => s + b.ranges.reduce((rs, r) => rs + r.products.length, 0), 0)
lines.push(`**Total** : ${CATALOG.brands.length} marques, ${total} produits`)
lines.push('')

lines.push('## Résumé des anomalies')
lines.push('')
lines.push('| Catégorie | Nombre |')
lines.push('|---|---|')
lines.push(`| Descriptions tronquées | ${sections.truncatedDescriptions.length} |`)
lines.push(`| Descriptions trop courtes (< 20 chars) | ${sections.shortDescriptions.length} |`)
lines.push(`| Descriptions très longues (> 800 chars — fusion suspecte) | ${sections.longDescriptions.length} |`)
lines.push(`| Noms de gammes louches | ${sections.suspiciousRangeNames.length} |`)
lines.push(`| Noms de produits louches | ${sections.suspiciousProductNames.length} |`)
lines.push(`| Produits sans tags auto | ${sections.productsWithoutTags.length} |`)
lines.push(`| Slugs dupliqués | ${sections.duplicateSlugs.length} |`)
lines.push(`| Marques avec déficit d'images | ${sections.imageDeficit.length} |`)
lines.push(`| Marques avec surplus d'images | ${sections.imageSurplus.length} |`)
lines.push('')

function dumpSection(title, items, render) {
  if (items.length === 0) return
  lines.push(`## ${title} (${items.length})`)
  lines.push('')
  for (const item of items) {
    lines.push(render(item))
  }
  lines.push('')
}

dumpSection('Descriptions tronquées', sections.truncatedDescriptions, item =>
  `- **${item.ref}** — ${item.name}\n  > …${item.end}`
)
dumpSection('Descriptions trop courtes', sections.shortDescriptions, item =>
  `- **${item.ref}** — ${item.name} (${item.length} chars) : "${item.description}"`
)
dumpSection('Descriptions très longues', sections.longDescriptions, item =>
  `- **${item.ref}** — ${item.name} (${item.length} chars)\n  > ${item.preview}`
)
dumpSection('Noms de gammes louches', sections.suspiciousRangeNames, item =>
  `- **${item.brand}** — "${item.range}"${item.description ? ` (desc: ${item.description})` : ''}`
)
dumpSection('Noms de produits louches', sections.suspiciousProductNames, item =>
  `- **${item.ref}** — "${item.name}"`
)
dumpSection('Produits sans tags auto', sections.productsWithoutTags, item =>
  `- **${item.ref}** — ${item.name}\n  > ${item.description}`
)
dumpSection('Slugs dupliqués', sections.duplicateSlugs, item =>
  `- **${item.slug}** : 1ère occurrence \`${item.firstSeen}\`, doublon \`${item.duplicateAt}\``
)
dumpSection('Marques avec déficit d\'images', sections.imageDeficit, item =>
  `- **${item.brand}** : ${item.products} produits / ${item.images} images → ${item.missing} produits sans image`
)
dumpSection('Marques avec surplus d\'images', sections.imageSurplus, item =>
  `- **${item.brand}** : ${item.products} produits / ${item.images} images → ${item.surplus} images orphelines`
)

lines.push('## Recommandations')
lines.push('')
lines.push('1. Éditer manuellement `db/catalog.json` pour corriger les descriptions tronquées (couper proprement à une phrase complète).')
lines.push('2. Pour les produits sans tags, ajouter manuellement dans `catalog.json` selon le contexte (peau grasse, anti-âge, etc.).')
lines.push('3. Les noms de gammes louches : vérifier dans le PDF source, renommer si besoin.')
lines.push('4. Les déficits d\'images (isdin) : les produits surnuméraires resteront sans image — uploader manuellement via /admin/product après le seed.')
lines.push('5. Les slugs dupliqués cassent l\'import : à corriger absolument avant `seed-import.cjs`.')

fs.writeFileSync(OUTPUT, lines.join('\n'))
console.error(`✓ Rapport généré : ${OUTPUT}`)
console.error('')
console.error('Top anomalies :')
for (const [name, items] of Object.entries(sections)) {
  if (items.length > 0) console.error(`  ${name.padEnd(30)} ${items.length}`)
}
