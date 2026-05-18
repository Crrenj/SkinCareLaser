#!/usr/bin/env node
/**
 * Parse les 13 PDFs de contenu_bd/fiche/ et produit db/catalog.json
 *
 * Heuristique :
 * - Brand : nom du fichier PDF (sans extension)
 * - Ranges : lignes "Línea X" / "Linea X" / "LINEA X" / "Protectores Solares" / etc.
 * - Products : lignes au format "Name: description"
 *   (bullets ●​ ou texte brut)
 * - Tags auto : skin_type / need / ingredient par mots-clés dans la description
 *
 * Le JSON résultant est éditable manuellement avant import.
 * Usage: node scripts/parse-pdfs.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const FICHE_DIR = path.join(__dirname, '..', 'contenu_bd', 'fiche')
const IMAGE_DIR = path.join(__dirname, '..', 'contenu_bd', 'image')
const OUTPUT = path.join(__dirname, '..', 'db', 'catalog.json')

// Mapping nom PDF → nom dossier image (corrige les coquilles)
const BRAND_FOLDER_MAP = {
  'aderma': 'adrema',
  'isisharma': 'isispharma',
}

// Mapping nom PDF → nom d'affichage propre
const BRAND_DISPLAY_NAME = {
  'acm': 'ACM',
  'aderma': 'A-Derma',
  'atache': 'Atache',
  'avene': 'Avène',
  'babe': 'Babe',
  'demo-genove': 'Genové',
  'ducray': 'Ducray',
  'elta-md': 'EltaMD',
  'filorga': 'Filorga',
  'isdin': 'ISDIN',
  'isisharma': 'Isispharma',
  'levissime': 'Levissime',
  'uriage': 'Uriage',
}

// Mots-clés pour le tagging automatique (en espagnol — c'est la langue des PDFs)
const SKIN_TYPE_KEYWORDS = {
  'grasse': ['piel grasa', 'pieles grasas', 'piel mixta', 'pieles mixtas', 'piel acneic'],
  'sèche': ['piel seca', 'pieles secas', 'pieles muy secas'],
  'sensible': ['piel sensible', 'pieles sensibles', 'piel reactiva'],
  'mixte': ['piel mixta', 'pieles mixtas'],
  'atopique': ['atópic', 'atopic'],
  'mature': ['piel madura', 'pieles maduras'],
  'normale': ['piel normal', 'pieles normales'],
}

const NEED_KEYWORDS = {
  'anti-âge': ['antiage', 'anti-edad', 'antiarrugas', 'arrugas', 'antienvejecim', 'rejuvenec', 'firmeza', 'reafirm'],
  'hydratation': ['hidrata', 'hydratante', 'humect'],
  'acné': ['acne', 'acné', 'acneic', 'imperfeccion', 'comedo', 'granitos'],
  'taches': ['mancha', 'despigment', 'unifica'],
  'rosacée': ['rosacea', 'rosácea'],
  'pellicules': ['caspa', 'anticaspa'],
  'chute de cheveux': ['caida', 'caída', 'anticaída', 'alopecia'],
  'protection solaire': ['spf', 'fotoprotect', 'protector solar', 'solar'],
  'exfoliation': ['exfoli', 'queratolitic'],
  'cernes': ['ojeras', 'bolsas', 'contorno de ojos'],
  'éclat': ['luminos', 'eclat', 'éclat', 'brillo'],
  'apaisant': ['calmante', 'apaisant', 'alivia'],
  'réparation': ['repara', 'cicatriz', 'regenerac'],
  'nettoyage': ['limpiador', 'limpia', 'desmaquill', 'micelar'],
}

const INGREDIENT_KEYWORDS = {
  'acide glycolique': ['ácido glicólico', 'acido glicólico', 'glicólico'],
  'acide salicylique': ['ácido salicílico', 'salicílico', 'salicilic'],
  'acide hyaluronique': ['ácido hialurónico', 'hialurónico'],
  'rétinol': ['retinol', 'retinaldehido', 'retinal'],
  'vitamine C': ['vitamina c', 'vit c'],
  'vitamine E': ['vitamina e'],
  'vitamine K': ['vitamina k'],
  'niacinamide': ['niacinamida'],
  'bakuchiol': ['bakuchiol'],
  'céramides': ['ceramidas', 'céramides'],
  'peptides': ['péptidos', 'peptidos'],
  'zinc': ['zinc'],
  'centella asiatica': ['centella'],
  'kojic acid': ['kojic', 'kójic'],
  'azelaic acid': ['azelaic', 'azelaico'],
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function detectTags(text) {
  const lower = text.toLowerCase()
  const tags = { skin_type: new Set(), need: new Set(), ingredient: new Set() }

  for (const [tag, keywords] of Object.entries(SKIN_TYPE_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) tags.skin_type.add(tag)
  }
  for (const [tag, keywords] of Object.entries(NEED_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) tags.need.add(tag)
  }
  for (const [tag, keywords] of Object.entries(INGREDIENT_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) tags.ingredient.add(tag)
  }

  return {
    skin_type: [...tags.skin_type],
    need: [...tags.need],
    ingredient: [...tags.ingredient],
  }
}

/**
 * Détecte un en-tête de gamme.
 * Retourne {name, description} ou null.
 */
function parseRangeHeader(line) {
  const trimmed = line.trim()
  if (!trimmed) return null

  // "Línea X" / "Linea X" / "LINEA X" / "Línea X (parenthèse)"
  // Accepte une parenthèse fermée OU une parenthèse qui se poursuit sur les lignes suivantes
  let m = trimmed.match(/^L[íi]nea\s+([^\(]+?)(?:\s*\(([^)]*)\)?)?$/i)
  if (m) {
    return { name: m[1].trim(), description: (m[2] || '').trim() }
  }

  // Sections sans "Línea" mais en titre
  const titleSections = ['Protectores Solares', 'Productos Capilares', 'Cuidado Corporal']
  for (const title of titleSections) {
    if (trimmed === title || trimmed.toLowerCase() === title.toLowerCase()) {
      return { name: title, description: '' }
    }
  }

  return null
}

/**
 * Détecte une ligne de début de produit "Name: description"
 * Retourne {name, description} ou null.
 */
function parseProductStart(line) {
  // Strip bullets, zero-width chars (U+200B U+200C U+200D U+FEFF), whitespace
  let cleaned = line
    .replace(/[​‌‍﻿]/g, '')
    .replace(/^[\s●▪•◦·*\-]+/, '')
    .trim()
  if (!cleaned) return null

  const colonIdx = cleaned.indexOf(':')
  if (colonIdx <= 0 || colonIdx > 80) return null

  const name = cleaned.slice(0, colonIdx).trim()
  const description = cleaned.slice(colonIdx + 1).trim()

  // Anti-faux-positif : nom commence par majuscule, max 10 mots
  if (!/^[A-ZÁÉÍÓÚÑ]/.test(name)) return null
  if (name.split(/\s+/).length > 10) return null
  if (/^(uso|para|contiene|aplicar|usar|ojo)\b/i.test(name)) return null
  if (!description) return null

  return { name, description }
}

function parsePdf(pdfPath, brandSlug) {
  const text = execSync(`pdftotext -layout "${pdfPath}" -`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
  const lines = text.split('\n')

  const ranges = []
  let currentRange = null
  let currentProduct = null

  // Range par défaut au cas où les produits apparaissent avant tout en-tête
  const defaultRange = { name: 'Général', slug: 'general', description: '', products: [] }

  for (const raw of lines) {
    const line = raw

    // Skip pure decorative lines
    if (!line.trim()) {
      // empty line — end of current product description block
      currentProduct = null
      continue
    }
    if (/^PRODUCTOS\s+/i.test(line.trim()) || /^LABORATORIOS\s+/i.test(line.trim())) {
      // Brand title line — skip
      continue
    }

    // Range header?
    const rangeMatch = parseRangeHeader(line)
    if (rangeMatch) {
      currentRange = {
        name: rangeMatch.name,
        slug: slugify(rangeMatch.name),
        description: rangeMatch.description,
        products: []
      }
      ranges.push(currentRange)
      currentProduct = null
      continue
    }

    // Product start?
    const productMatch = parseProductStart(line)
    if (productMatch) {
      if (!currentRange) {
        currentRange = defaultRange
        if (!ranges.includes(defaultRange)) ranges.push(defaultRange)
      }
      currentProduct = {
        name: productMatch.name,
        slug: `${brandSlug}-${slugify(productMatch.name)}`,
        description: productMatch.description,
        tags: { skin_type: [], need: [], ingredient: [] }
      }
      currentRange.products.push(currentProduct)
      continue
    }

    // Continuation of current product description
    if (currentProduct) {
      const continuation = line.trim()
      // Skip lines that look like decorations
      if (continuation && !/^[●▪•◦·*-]+$/.test(continuation)) {
        currentProduct.description += ' ' + continuation
      }
    }
  }

  // Auto-tagging pass + déduplication des slugs (variantes "UVEBLOCK SPF 50+" multiples)
  const slugCounts = new Map()
  for (const range of ranges) {
    for (const product of range.products) {
      product.description = product.description.replace(/\s+/g, ' ').trim()
      const fullText = `${product.name} ${range.description} ${product.description}`
      product.tags = detectTags(fullText)

      const baseSlug = product.slug
      const n = (slugCounts.get(baseSlug) || 0) + 1
      slugCounts.set(baseSlug, n)
      if (n > 1) product.slug = `${baseSlug}-${n}`
    }
  }

  return ranges.filter(r => r.products.length > 0)
}

function listImages(brandSlug) {
  const folder = BRAND_FOLDER_MAP[brandSlug] || brandSlug
  const dir = path.join(IMAGE_DIR, folder)
  if (!fs.existsSync(dir)) return { folder, strategy: 'none', files: [] }

  const all = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))

  // Babe-style : noms slugifiés (au moins une majorité ne matche pas imageN)
  const isNumbered = all.every(f => /^image\d+\.(png|jpg|jpeg|webp)$/i.test(f))
  if (isNumbered && all.length > 0) {
    return {
      folder,
      strategy: 'positional',
      files: all.sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10)),
    }
  }
  return {
    folder,
    strategy: 'by-slug',
    files: all.sort(),
  }
}

function main() {
  const pdfs = fs.readdirSync(FICHE_DIR)
    .filter(f => f.endsWith('.pdf'))
    .sort()

  const catalog = { brands: [] }

  for (const pdf of pdfs) {
    const brandSlug = pdf.replace(/\.pdf$/, '')
    const pdfPath = path.join(FICHE_DIR, pdf)
    const displayName = BRAND_DISPLAY_NAME[brandSlug] || brandSlug
    const imageInfo = listImages(brandSlug)

    console.error(`Parsing ${pdf} (folder: ${imageInfo.folder}, ${imageInfo.files.length} images, strategy: ${imageInfo.strategy})...`)

    const ranges = parsePdf(pdfPath, brandSlug)
    const productCount = ranges.reduce((sum, r) => sum + r.products.length, 0)

    catalog.brands.push({
      slug: brandSlug,
      name: displayName,
      pdf_file: pdf,
      image_folder: imageInfo.folder,
      image_strategy: imageInfo.strategy,
      image_files: imageInfo.files,
      ranges,
      stats: {
        ranges: ranges.length,
        products: productCount,
        images: imageInfo.files.length,
      }
    })

    console.error(`  → ${ranges.length} ranges, ${productCount} products, ${imageInfo.files.length} images`)
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(catalog, null, 2))
  console.error(`\n✓ Catalogue écrit dans ${OUTPUT}`)

  // Sommaire
  const totalRanges = catalog.brands.reduce((s, b) => s + b.ranges.length, 0)
  const totalProducts = catalog.brands.reduce((s, b) => s + b.stats.products, 0)
  const totalImages = catalog.brands.reduce((s, b) => s + b.stats.images, 0)
  console.error(`\nTOTAL : ${catalog.brands.length} marques, ${totalRanges} gammes, ${totalProducts} produits, ${totalImages} images`)
  console.error(`\nSTRATÉGIES IMAGES :`)
  for (const b of catalog.brands) {
    console.error(`  ${b.slug.padEnd(15)} ${b.image_strategy.padEnd(11)} ${b.stats.images.toString().padStart(3)} images / ${b.stats.products} produits`)
  }
}

main()
